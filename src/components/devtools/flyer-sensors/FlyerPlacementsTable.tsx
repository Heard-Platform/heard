import type { ChangeEvent, MouseEvent } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { placementPosition } from "./flyer-location";
import { formatClockTime, formatCoordinate } from "./format";
import { formatHeading } from "./heading";
import type { FlyerPlacement } from "./sensor-types";

interface FlyerPlacementsTableProps {
  placements: FlyerPlacement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFlyerGroupChange: (id: string, flyerGroup: number) => void;
  onResetPosition: (id: string) => void;
  onClearHeading: (id: string) => void;
  onRemove: (id: string) => void;
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

function FlyerGroupInput({ placement, onChange }: { placement: FlyerPlacement; onChange: (flyerGroup: number) => void }) {
  return (
    <Input
      type="number"
      min={1}
      step={1}
      aria-label="Flyer number"
      className="w-20 h-8"
      value={placement.flyerGroup}
      onClick={(event: MouseEvent) => event.stopPropagation()}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const flyerGroup = Number(event.target.value);
        if (Number.isInteger(flyerGroup) && flyerGroup > 0) onChange(flyerGroup);
      }}
    />
  );
}

interface PositionCellProps {
  placement: FlyerPlacement;
  onResetPosition: () => void;
}

function PositionCell({ placement, onResetPosition }: PositionCellProps) {
  if (!placement.cluster) return <span className="text-orange-600">Added on map</span>;
  if (placement.manualPosition) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-orange-600">Moved</span>
        <RowActionButton label="Reset" onClick={onResetPosition} />
      </div>
    );
  }
  return <span className="text-slate-500">GPS estimate</span>;
}

export function FlyerPlacementsTable({
  placements,
  selectedId,
  onSelect,
  onFlyerGroupChange,
  onResetPosition,
  onClearHeading,
  onRemove,
}: FlyerPlacementsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-slate-600">
            <th className="p-2">Flyer #</th>
            <th className="p-2">Time</th>
            <th className="p-2">Tap peaks (m/s²)</th>
            <th className="p-2">Latitude</th>
            <th className="p-2">Longitude</th>
            <th className="p-2">GPS accuracy</th>
            <th className="p-2">Fixes averaged</th>
            <th className="p-2">Position</th>
            <th className="p-2">Facing</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {placements.map((placement) => {
            const position = placementPosition(placement);
            return (
              <tr
                key={placement.id}
                onClick={() => onSelect(placement.id)}
                className={`border-b cursor-pointer ${
                  placement.id === selectedId ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <td className="p-2">
                  <FlyerGroupInput
                    placement={placement}
                    onChange={(flyerGroup) => onFlyerGroupChange(placement.id, flyerGroup)}
                  />
                </td>
                <td className="p-2">{placement.cluster ? formatClockTime(placement.cluster.startMs) : "—"}</td>
                <td className="p-2">
                  {placement.cluster?.peaks.map((peak) => peak.magnitude.toFixed(0)).join(", ") ?? "—"}
                </td>
                <td className="p-2 font-mono">{position ? formatCoordinate(position.latitude) : "—"}</td>
                <td className="p-2 font-mono">{position ? formatCoordinate(position.longitude) : "—"}</td>
                <td className="p-2">
                  {placement.location
                    ? `±${placement.location.horizontalAccuracyM.toFixed(0)} m`
                    : placement.cluster
                      ? "No GPS fix"
                      : "—"}
                </td>
                <td className="p-2">{placement.location?.fixCount ?? 0}</td>
                <td className="p-2">
                  <PositionCell
                    placement={placement}
                    onResetPosition={() => onResetPosition(placement.id)}
                  />
                </td>
                <td className="p-2">
                  {placement.headingDeg === null ? (
                    <span className="text-slate-500">—</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{formatHeading(placement.headingDeg)}</span>
                      <RowActionButton label="Clear" onClick={() => onClearHeading(placement.id)} />
                    </div>
                  )}
                </td>
                <td className="p-2">
                  <RowActionButton
                    label={placement.cluster ? "Not a flyer" : "Remove"}
                    onClick={() => onRemove(placement.id)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
