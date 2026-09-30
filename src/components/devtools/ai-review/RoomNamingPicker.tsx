import { useState } from "react";
import { defaultFilter } from "cmdk";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { ReviewRoomOption } from "../../../types";

interface RoomNamingPickerProps {
  rooms: ReviewRoomOption[];
  loading: boolean;
  running: boolean;
  onSelect: (roomId: string) => void;
}

const filterByTopic = (_value: string, search: string, keywords?: string[]) =>
  defaultFilter(keywords?.join(" ") ?? "", search);

export function RoomNamingPicker({ rooms, loading, running, onSelect }: RoomNamingPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (roomId: string) => {
    setOpen(false);
    onSelect(roomId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between" disabled={loading || running}>
          <span className="flex items-center gap-2 text-slate-600">
            {running && <Loader2 className="w-4 h-4 animate-spin" />}
            {running ? "Naming clusters…" : "Choose a room to name its clusters…"}
          </span>
          <ChevronsUpDown className="w-4 h-4 text-slate-400" />
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
                  key={room.roomId}
                  value={room.roomId}
                  keywords={[room.topic]}
                  onSelect={() => handleSelect(room.roomId)}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="truncate">{room.topic}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {room.voteCount.toLocaleString()} votes
                    </span>
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
