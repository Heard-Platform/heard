import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { api, safelyMakeApiCall } from "../../utils/api";
import { devApi } from "../../utils/dev-api";
import type { DebateRoom } from "../../types";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn } from "../ui/utils";

const substringFilter = (value: string, search: string) =>
  value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;

export function TestingTab() {
  const [rooms, setRooms] = useState<DebateRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await safelyMakeApiCall(() => api.getAllPosts());
      if (response?.success && response.data?.posts) {
        setRooms(response.data.posts);
      }
      setLoadingRooms(false);
    };
    load();
  }, []);

  const handleSelect = async (roomId: string) => {
    setOpen(false);
    setSelectedRoomId(roomId);
    setHtml(null);
    setLoading(true);
    const result = await devApi.getRoomOgHtml(roomId);
    setHtml(result);
    setLoading(false);
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedLabel = selectedRoom
    ? `${selectedRoom.emoji ? `${selectedRoom.emoji} ` : ""}${selectedRoom.topic}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium mb-1">Link Preview Testing</h2>
        <p className="text-slate-500 text-sm mb-4">
          Renders the OG HTML returned by the Supabase endpoint — what social crawlers see when a room link is shared.
        </p>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={loadingRooms}
              className="w-full justify-between font-normal"
            >
              <span className="truncate">
                {loadingRooms ? "Loading rooms…" : (selectedLabel ?? "Select a room…")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command filter={substringFilter}>
              <CommandInput placeholder="Search rooms…" />
              <CommandList>
                <CommandEmpty>No rooms found.</CommandEmpty>
                <CommandGroup>
                  {rooms.map((room) => {
                    const label = `${room.emoji ? `${room.emoji} ` : ""}${room.topic}`;
                    return (
                      <CommandItem
                        key={room.id}
                        value={label}
                        onSelect={() => handleSelect(room.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedRoomId === room.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {loading && (
        <p className="text-slate-500 text-sm">Loading preview…</p>
      )}

      {html && !loading && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Preview</p>
          <iframe
            srcDoc={html}
            sandbox="allow-same-origin"
            className="w-full border border-slate-200 rounded-lg"
            style={{ height: 340 }}
            title="OG preview"
          />
          <details>
            <summary className="text-sm text-slate-500 cursor-pointer select-none">
              View raw HTML
            </summary>
            <pre className="mt-2 p-4 bg-slate-50 rounded-lg text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap border border-slate-200">
              {html}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
