import { useRoomAlertsContext } from "../../contexts/RoomAlertsContext";

export function AvatarAlertDot() {
  const { alerts } = useRoomAlertsContext();
  if (alerts.length === 0) return null;
  return (
    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full" />
  );
}
