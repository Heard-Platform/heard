import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { devApi } from "../../utils/dev-api";

interface FlyerRoomData {
  topic: string;
  groups: Record<number, number>;
  lastUserCreated: number;
}

export function FlyersTab() {
  const [flyerRoomData, setFlyerRoomData] = useState<Record<string, FlyerRoomData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlyerStats();
  }, []);

  const fetchFlyerStats = async () => {
    setLoading(true);
    try {
      const response = await devApi.getFlyerStats();
      if (response.success && response.data) {
        setFlyerRoomData(response.data.flyerRoomData);
      }
    } catch (error) {
      console.error("Error fetching flyer stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Loading flyer statistics...</p>
      </Card>
    );
  }

  const flyerIds = Object.keys(flyerRoomData);

  if (flyerIds.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Flyer Statistics</h2>
        <p className="text-gray-500">No flyer data available.</p>
      </Card>
    );
  }

  const allGroups = new Set<number>();
  flyerIds.forEach(flyerId => {
    Object.keys(flyerRoomData[flyerId].groups).forEach(group => {
      allGroups.add(parseInt(group));
    });
  });

  const sortedGroups = Array.from(allGroups).sort((a, b) => a - b);
  
  const sortedFlyerIds = flyerIds.sort((a, b) => {
    return flyerRoomData[b].lastUserCreated - flyerRoomData[a].lastUserCreated;
  });

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Flyer Statistics</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-semibold">Room Topic</th>
              {sortedGroups.map(group => (
                <th key={group} className="text-center p-2 font-semibold">
                  Group {group === 0 ? "N/A" : group}
                </th>
              ))}
              <th className="text-center p-2 font-semibold bg-gray-100">Total</th>
              <th className="text-left p-2 font-semibold">Last User Created</th>
            </tr>
          </thead>
          <tbody>
            {sortedFlyerIds.map(flyerId => {
              const roomData = flyerRoomData[flyerId];
              const rowTotal = Object.values(roomData.groups).reduce((sum, count) => sum + count, 0);
              return (
                <tr key={flyerId} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-sm">{roomData.topic}</td>
                  {sortedGroups.map(group => (
                    <td key={group} className="text-center p-2">
                      {roomData.groups[group] || 0}
                    </td>
                  ))}
                  <td className="text-center p-2 font-semibold bg-gray-100">
                    {rowTotal}
                  </td>
                  <td className="p-2 text-xs text-gray-600">
                    {formatDate(roomData.lastUserCreated)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}