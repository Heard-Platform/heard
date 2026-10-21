import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { addHotTake, removeHotTake, updateHotTake } from "./create-post-utils";

const MAX_TAKE_LENGTH = 280;
const SCROLL_END_SLACK_PX = 4;

interface HotTakesListProps {
  takes: string[];
  autoFocusAdd?: boolean;
  onTakesChange: (takes: string[]) => void;
}

export function HotTakesList({ takes, autoFocusAdd = false, onTakesChange }: HotTakesListProps) {
  const [newTake, setNewTake] = useState("");
  const [showFade, setShowFade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(takes.length);

  const updateFade = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowFade(el.scrollHeight - el.scrollTop - el.clientHeight > SCROLL_END_SLACK_PX);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateFade);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && takes.length > prevCountRef.current) el.scrollTop = el.scrollHeight;
    prevCountRef.current = takes.length;
    updateFade();
  }, [takes.length]);

  const handleAdd = () => {
    if (!newTake.trim()) return;
    onTakesChange(addHotTake(takes, newTake));
    setNewTake("");
    addInputRef.current?.focus();
  };

  const handleAddKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleAdd();
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.currentTarget.blur();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border inactive-border creation-list-bg">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} onScroll={updateFade} className="min-h-0 flex-1 overflow-y-auto">
          {takes.map((take, index) => (
            <div
              key={index}
              className="flex items-start gap-1 border-b inactive-border pl-3 focus-within:bg-white creation-focus-within"
            >
              <label className="flex min-w-0 flex-1 cursor-text items-start gap-1.5">
                <span className="sr-only">Edit hot take {index + 1}</span>
                <textarea
                  value={take}
                  rows={1}
                  maxLength={MAX_TAKE_LENGTH}
                  onChange={(e) => onTakesChange(updateHotTake(takes, index, e.target.value))}
                  onKeyDown={handleEditKeyDown}
                  className="field-sizing-content min-w-0 flex-1 resize-none bg-transparent py-3 text-[15px] leading-snug text-foreground outline-none"
                />
                <Pencil aria-hidden="true" className="mt-4 size-3.5 shrink-0 secondary-text" />
              </label>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Delete hot take ${index + 1}`}
                onClick={() => onTakesChange(removeHotTake(takes, index))}
                className="size-11 shrink-0 p-0 secondary-text"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        {showFade && (
          <div aria-hidden="true" className="creation-list-fade pointer-events-none absolute inset-x-0 bottom-0 h-9" />
        )}
      </div>

      <div
        className={`flex shrink-0 items-center gap-2 bg-white pr-1 pl-3 creation-focus-within ${
          takes.length > 0 ? "border-t inactive-border" : ""
        }`}
      >
        <Plus aria-hidden="true" className="size-4 shrink-0 creation-strong-text" />
        <label htmlFor="new-hot-take" className="sr-only">
          Add a hot take
        </label>
        <input
          id="new-hot-take"
          ref={addInputRef}
          value={newTake}
          maxLength={MAX_TAKE_LENGTH}
          autoFocus={autoFocusAdd}
          enterKeyHint="done"
          placeholder="Add a hot take"
          onChange={(e) => setNewTake(e.target.value)}
          onKeyDown={handleAddKeyDown}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        {newTake.trim() && (
          <Button type="button" size="sm" onClick={handleAdd} className="creation-solid-bg font-bold">
            Add
          </Button>
        )}
      </div>
    </div>
  );
}
