import { useState } from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { topicMatchesSearch } from "../utils/room-search";

export interface RoomSearchOption {
  id: string;
  topic: string;
  detail?: string;
}

interface RoomSearchPickerProps {
  id?: string;
  rooms: RoomSearchOption[];
  selectedRoomId?: string | null;
  placeholder: string;
  loading?: boolean;
  busyLabel?: string | null;
  onSelect: (roomId: string) => void;
}

const filterByTopic = (_value: string, search: string, keywords?: string[]) =>
  topicMatchesSearch(keywords?.join(" ") ?? "", search) ? 1 : 0;

export function RoomSearchPicker({
  id,
  rooms,
  selectedRoomId = null,
  placeholder,
  loading = false,
  busyLabel = null,
  onSelect,
}: RoomSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
  const triggerLabel = busyLabel ?? selectedRoom?.topic ?? (loading ? "Loading rooms…" : placeholder);

  const handleSelect = (roomId: string) => {
    setOpen(false);
    onSelect(roomId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className="w-full justify-between"
          disabled={loading || busyLabel !== null}
        >
          <span className={`flex min-w-0 items-center gap-2 ${selectedRoom && !busyLabel ? "text-slate-900" : "text-slate-600"}`}>
            {busyLabel && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
            <span className="truncate">{triggerLabel}</span>
          </span>
          <ChevronsUpDown className="w-4 h-4 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command filter={filterByTopic}>
          <CommandInput placeholder="Search rooms…" />
          <CommandList>
            <CommandEmpty>No rooms found.</CommandEmpty>
            <CommandGroup>
              {rooms.map((room) => (
                <CommandItem
                  key={room.id}
                  value={room.id}
                  keywords={[room.topic]}
                  onSelect={() => handleSelect(room.id)}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="truncate">{room.topic}</span>
                    {room.detail && <span className="shrink-0 text-xs text-slate-500">{room.detail}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
