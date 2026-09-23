import type { MouseEvent } from "react";
import { Button } from "../../ui/button";
import { placementPosition } from "./flyer-location";
import { formatClockTime, formatCoordinate } from "./format";
import { formatHeading } from "./heading";
import type { FlyerVotesByTapTime } from "./flyer-votes";
import type { FlyerPlacement } from "./sensor-types";

interface FlyerPlacementsTableProps {
  placements: FlyerPlacement[];
  selectedNumber: number | null;
  votes: FlyerVotesByTapTime | null;
  onSelect: (number: number) => void;
  onResetPosition: (number: number) => void;
  onClearHeading: (number: number) => void;
}

function RowActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(event: MouseEvent) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {label}
    </Button>
  );
}

function VotesCell({ votes, placement }: { votes: FlyerVotesByTapTime; placement: FlyerPlacement }) {
  const tally = votes[placement.cluster.startMs];
  if (!tally) return <td className="p-2 text-slate-500">0</td>;
  return (
    <td className="p-2 whitespace-nowrap">
      <span className="text-green-700">{tally.agrees} agree</span>
      {" · "}
      <span className="text-red-700">{tally.disagrees} disagree</span>
    </td>
  );
}

export function FlyerPlacementsTable({
  placements,
  selectedNumber,
  votes,
  onSelect,
  onResetPosition,
  onClearHeading,
}: FlyerPlacementsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-slate-600">
            <th className="p-2">#</th>
            <th className="p-2">Time</th>
            <th className="p-2">Tap peaks (m/s²)</th>
            <th className="p-2">Latitude</th>
            <th className="p-2">Longitude</th>
            <th className="p-2">GPS accuracy</th>
            <th className="p-2">Fixes averaged</th>
            <th className="p-2">Position</th>
            <th className="p-2">Facing</th>
            {votes && <th className="p-2">Votes</th>}
          </tr>
        </thead>
        <tbody>
          {placements.map((placement) => {
            const position = placementPosition(placement);
            return (
              <tr
                key={placement.number}
                onClick={() => onSelect(placement.number)}
                className={`border-b cursor-pointer ${
                  placement.number === selectedNumber ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <td className="p-2 font-medium">{placement.number}</td>
                <td className="p-2">{formatClockTime(placement.cluster.startMs)}</td>
                <td className="p-2">
                  {placement.cluster.peaks.map((peak) => peak.magnitude.toFixed(0)).join(", ")}
                </td>
                <td className="p-2 font-mono">{position ? formatCoordinate(position.latitude) : "—"}</td>
                <td className="p-2 font-mono">{position ? formatCoordinate(position.longitude) : "—"}</td>
                <td className="p-2">
                  {placement.location ? `±${placement.location.horizontalAccuracyM.toFixed(0)} m` : "No GPS fix"}
                </td>
                <td className="p-2">{placement.location?.fixCount ?? 0}</td>
                <td className="p-2">
                  {placement.manualPosition ? (
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">Moved</span>
                      <RowActionButton label="Reset" onClick={() => onResetPosition(placement.number)} />
                    </div>
                  ) : (
                    <span className="text-slate-500">GPS estimate</span>
                  )}
                </td>
                <td className="p-2">
                  {placement.headingDeg === null ? (
                    <span className="text-slate-500">—</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{formatHeading(placement.headingDeg)}</span>
                      <RowActionButton label="Clear" onClick={() => onClearHeading(placement.number)} />
                    </div>
                  )}
                </td>
                {votes && <VotesCell votes={votes} placement={placement} />}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
