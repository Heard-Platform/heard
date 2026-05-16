import { Bell, Flag } from "lucide-react";
import { useRoomAlertsContext } from "../../contexts/RoomAlertsContext";
import { api, safelyMakeApiCall } from "../../utils/api";

interface RoomAlertsListProps {
  onJumpToRoom: (roomId: string, subHeard?: string) => void;
}

export function RoomAlertsList({ onJumpToRoom }: RoomAlertsListProps) {
  const { alerts, clearAlert } = useRoomAlertsContext();

  const handleTap = (roomId: string, subHeard?: string) => {
    clearAlert(roomId);
    safelyMakeApiCall(() => api.markRoomSeen(roomId));
    onJumpToRoom(roomId, subHeard);
  };
  const hasAlerts = alerts.length > 0;
  const headerStyles = hasAlerts
    ? "bg-red-50 border-b border-red-200"
    : "bg-gray-50 border-b border-gray-200";
  const iconStyles = hasAlerts ? "text-red-600" : "text-gray-400";
  const labelStyles = hasAlerts ? "text-red-900" : "text-gray-700";
  const containerStyles = hasAlerts ? "border-red-200" : "border-gray-200";

  return (
    <div className={`border rounded-lg overflow-hidden ${containerStyles}`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${headerStyles}`}>
        <Bell className={`w-4 h-4 ${iconStyles}`} />
        <span className={`text-sm font-medium ${labelStyles}`}>Updates</span>
        {hasAlerts && (
          <span className="text-xs text-red-700 ml-auto">{alerts.length}</span>
        )}
      </div>
      {!hasAlerts && (
        <div className="px-3 py-4 text-center text-sm text-gray-500">
          No updates from rooms you follow.
        </div>
      )}
      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
        {alerts.map(({ roomId, topic, emoji, subHeard, reason }) => (
          <button
            key={roomId}
            onClick={() => handleTap(roomId, subHeard)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
          >
            {emoji && <span className="text-base flex-shrink-0">{emoji}</span>}
            <span className="text-sm flex-1 truncate">{topic}</span>
            {reason === "ended" ? (
              <span className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
                <Flag className="w-3 h-3" />
                ended
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-600 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                new
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
