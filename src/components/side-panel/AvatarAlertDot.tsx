import { useRoomAlertsContext } from "../../contexts/RoomAlertsContext";

export function AvatarAlertDot() {
  const { alerts } = useRoomAlertsContext();
  if (alerts.length === 0) return null;
  return (
    <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
  );
}
