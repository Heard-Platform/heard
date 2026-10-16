import { useState } from "react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { CalendarDays } from "lucide-react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  DATE_RANGE_PRESETS,
  formatDateRangeSelection,
  type DateRangePresetKey,
  type DateRangeSelection,
} from "./date-range-presets";

interface DateRangeFilterProps {
  selection: DateRangeSelection;
  onChange: (selection: DateRangeSelection) => void;
}

export function DateRangeFilter({ selection, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DayPickerRange | undefined>(
    selection.kind === "custom" ? { from: selection.from, to: selection.to } : undefined,
  );

  const handlePresetClick = (preset: DateRangePresetKey) => {
    setDraftRange(undefined);
    onChange({ kind: "preset", preset });
    setOpen(false);
  };

  const handleCalendarSelect = (range: DayPickerRange | undefined) => {
    setDraftRange(range);
    if (range?.from && range.to) {
      onChange({ kind: "custom", from: range.from, to: range.to });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarDays className="w-4 h-4 mr-2" />
          {formatDateRangeSelection(selection)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-2">
            {DATE_RANGE_PRESETS.map((preset) => (
              <Button
                key={preset.key}
                variant={selection.kind === "preset" && selection.preset === preset.key ? "default" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => handlePresetClick(preset.key)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={draftRange}
            onSelect={handleCalendarSelect}
            disabled={{ after: new Date() }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
