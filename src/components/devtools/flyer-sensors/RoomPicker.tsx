import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";

export interface RoomOption {
  id: string;
  topic: string;
  createdAt: number;
}

interface RoomPickerProps {
  rooms: RoomOption[];
  loading: boolean;
  selectedRoomId: string | null;
  onChange: (roomId: string) => void;
}

function formatRoomDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function RoomPicker({ rooms, loading, selectedRoomId, onChange }: RoomPickerProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor="flyer-sensors-room">Room</Label>
      <Select value={selectedRoomId ?? undefined} onValueChange={onChange} disabled={loading}>
        <SelectTrigger id="flyer-sensors-room" className="w-full">
          <SelectValue placeholder={loading ? "Loading rooms…" : "Select the room these flyers promote"} />
        </SelectTrigger>
        <SelectContent>
          {rooms.map((room) => (
            <SelectItem key={room.id} value={room.id}>
              <span className="truncate">{room.topic}</span>
              <span className="text-xs text-slate-400 ml-2">{formatRoomDate(room.createdAt)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
