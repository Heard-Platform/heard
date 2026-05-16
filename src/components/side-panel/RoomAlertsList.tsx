import { Bell, Flag } from "lucide-react";
import { useRoomAlertsContext } from "../../contexts/RoomAlertsContext";

interface RoomAlertsListProps {
  onJumpToRoom: (roomId: string) => void;
}

export function RoomAlertsList({ onJumpToRoom }: RoomAlertsListProps) {
  const { alerts } = useRoomAlertsContext();
  if (alerts.length === 0) return null;

  return (
    <div className="border border-red-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-b border-red-200">
        <Bell className="w-4 h-4 text-red-600" />
        <span className="text-sm font-medium text-red-900">Updates</span>
        <span className="text-xs text-red-700 ml-auto">{alerts.length}</span>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
        {alerts.map(({ roomId, topic, emoji, reason }) => (
          <button
            key={roomId}
            onClick={() => onJumpToRoom(roomId)}
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
