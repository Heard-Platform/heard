import { useState } from "react";
import { chartPointerTime, type ChartPointerState } from "./chart-pointer";
import type { TimeWindow } from "./time-window";

const MIN_SELECTION_WIDTH_MS = 200;

export function useDragSelect(onSelect: (window: TimeWindow) => void) {
  const [drag, setDrag] = useState<TimeWindow | null>(null);

  const selection = drag && {
    startMs: Math.min(drag.startMs, drag.endMs),
    endMs: Math.max(drag.startMs, drag.endMs),
  };

  const handleMouseDown = (state: ChartPointerState | null) => {
    const time = chartPointerTime(state);
    if (time !== null) setDrag({ startMs: time, endMs: time });
  };

  const handleMouseMove = (state: ChartPointerState | null) => {
    const time = chartPointerTime(state);
    if (drag && time !== null) setDrag({ ...drag, endMs: time });
  };

  const handleMouseUp = () => {
    if (selection && selection.endMs - selection.startMs >= MIN_SELECTION_WIDTH_MS) {
      onSelect(selection);
    }
    setDrag(null);
  };

  return {
    selection,
    chartHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: () => setDrag(null),
    },
  };
}
