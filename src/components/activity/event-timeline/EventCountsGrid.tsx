import type { EventDayCountsGrid } from "./event-timeline-utils";
import { formatDayLabel } from "./event-timeline-utils";

// Sequential blue ramp, lightest = near zero. Same hue as the signups chart.
const SEQUENTIAL_RAMP = [
  "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7",
  "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b",
];
const FIRST_DARK_STEP = 6;
const TEXT_PRIMARY = "#0b0b0b";
const TEXT_MUTED = "#898781";

function rampIndexFor(count: number, maxCount: number): number {
  // sqrt scale so high-volume events (page loads) don't wash out everything else
  const ratio = Math.sqrt(count / maxCount);
  return Math.min(SEQUENTIAL_RAMP.length - 1, Math.floor(ratio * SEQUENTIAL_RAMP.length));
}

function CountCell({ count, maxCount, title }: { count: number; maxCount: number; title: string }) {
  if (count === 0) {
    return (
      <td title={title} className="px-1 py-1">
        <div className="h-7 rounded flex items-center justify-center text-xs" style={{ color: TEXT_MUTED }}>
          ·
        </div>
      </td>
    );
  }

  const rampIndex = rampIndexFor(count, maxCount);
  return (
    <td title={title} className="px-1 py-1">
      <div
        className="h-7 rounded flex items-center justify-center text-xs tabular-nums"
        style={{
          background: SEQUENTIAL_RAMP[rampIndex],
          color: rampIndex >= FIRST_DARK_STEP ? "#ffffff" : TEXT_PRIMARY,
        }}
      >
        {count.toLocaleString()}
      </div>
    </td>
  );
}

interface EventCountsGridProps {
  grid: EventDayCountsGrid;
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
}

export function EventCountsGrid({ grid, selectedType, onSelectType }: EventCountsGridProps) {
  if (grid.rows.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No events in the last week.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left font-medium text-xs px-2 py-1" style={{ color: TEXT_MUTED }}>
              Event
            </th>
            {grid.dayStarts.map((day) => (
              <th key={day} className="font-medium text-xs px-1 py-1 whitespace-nowrap" style={{ color: TEXT_MUTED }}>
                {formatDayLabel(day)}
              </th>
            ))}
            <th className="text-right font-medium text-xs px-2 py-1" style={{ color: TEXT_MUTED }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row) => {
            const isSelected = row.type === selectedType;
            return (
              <tr
                key={row.type}
                onClick={() => onSelectType(isSelected ? null : row.type)}
                className={`cursor-pointer ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
              >
                <td className="px-2 py-1 font-mono text-xs whitespace-nowrap" style={{ color: TEXT_PRIMARY }}>
                  {row.type}
                </td>
                {row.countsByDay.map((count, i) => (
                  <CountCell
                    key={grid.dayStarts[i]}
                    count={count}
                    maxCount={grid.maxCount}
                    title={`${row.type} · ${formatDayLabel(grid.dayStarts[i])}: ${count.toLocaleString()}`}
                  />
                ))}
                <td className="px-2 py-1 text-right text-xs tabular-nums font-medium" style={{ color: TEXT_PRIMARY }}>
                  {row.total.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
