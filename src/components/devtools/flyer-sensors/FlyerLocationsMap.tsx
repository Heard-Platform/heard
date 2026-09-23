import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  divIcon,
  latLngBounds,
  point,
  type LatLngExpression,
  type Marker as LeafletMarker,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import { placementPosition } from "./flyer-location";
import { maxVoteTotal, ringThicknessPx, type FlyerVotesByTapTime } from "./flyer-votes";
import { bearingBetween, offsetByBearing } from "./heading";
import { voteRingIcon } from "./vote-ring-icon";
import type { FlyerPlacement, LatLng, LocationFix } from "./sensor-types";

interface FlyerLocationsMapProps {
  placements: FlyerPlacement[];
  track: LocationFix[];
  selectedNumber: number | null;
  hoverPosition: LatLng | null;
  votes: FlyerVotesByTapTime | null;
  onSelect: (number: number) => void;
  onDeselect: () => void;
  onMove: (number: number, position: LatLng) => void;
  onHeadingChange: (number: number, headingDeg: number) => void;
}

const MAP_HEIGHT_PX = 480;
const MARKER_SIZE_PX = 26;
const ESTIMATED_COLOR = "#16a34a";
const MOVED_COLOR = "#ea580c";
const SELECTED_COLOR = "#2563eb";
const HEADING_HANDLE_DISTANCE_PX = 56;
const HEADING_HANDLE_SIZE_PX = 16;
const HOVER_COLOR = "#9333ea";

function toLatLng(point: LatLng): LatLngExpression {
  return [point.latitude, point.longitude];
}

function markerColor(placement: FlyerPlacement, selected: boolean): string {
  if (selected) return SELECTED_COLOR;
  return placement.manualPosition ? MOVED_COLOR : ESTIMATED_COLOR;
}

function headingArrowHtml(headingDeg: number, color: string): string {
  return `<div style="position:absolute;inset:0;transform:rotate(${headingDeg}deg);pointer-events:none;"><div style="position:absolute;left:50%;top:-11px;margin-left:-7px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid ${color};"></div></div>`;
}

function pinSizePx(selected: boolean): number {
  return selected ? MARKER_SIZE_PX + 6 : MARKER_SIZE_PX;
}

function flyerIcon(placement: FlyerPlacement, selected: boolean) {
  const size = pinSizePx(selected);
  const color = markerColor(placement, selected);
  const arrow = placement.headingDeg === null ? "" : headingArrowHtml(placement.headingDeg, color);
  return divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="position:relative;width:${size}px;height:${size}px;">${arrow}<div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);color:#fff;font:600 12px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;cursor:grab;">${placement.number}</div></div>`,
  });
}

function headingHandleIcon(hasHeading: boolean) {
  return divIcon({
    className: "",
    iconSize: [HEADING_HANDLE_SIZE_PX, HEADING_HANDLE_SIZE_PX],
    iconAnchor: [HEADING_HANDLE_SIZE_PX / 2, HEADING_HANDLE_SIZE_PX / 2],
    html: `<div title="Drag to set the direction this flyer faces" style="width:${HEADING_HANDLE_SIZE_PX}px;height:${HEADING_HANDLE_SIZE_PX}px;border-radius:50%;background:#fff;border:3px solid ${SELECTED_COLOR};opacity:${hasHeading ? 1 : 0.6};box-shadow:0 1px 3px rgba(0,0,0,0.4);cursor:grab;"></div>`,
  });
}

function FitToTrack({ track }: { track: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (track.length > 0) map.fitBounds(latLngBounds(track), { padding: [24, 24] });
  }, [map, track]);
  return null;
}

function DeselectOnMapClick({ onDeselect }: { onDeselect: () => void }) {
  useMapEvents({ click: onDeselect });
  return null;
}

interface HeadingHandleProps {
  placement: FlyerPlacement;
  position: LatLng;
  onHeadingChange: (number: number, headingDeg: number) => void;
}

function HeadingHandle({ placement, position, onHeadingChange }: HeadingHandleProps) {
  const map = useMap();
  const [, setZoomLevel] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoomLevel(map.getZoom()) });

  const center = map.latLngToLayerPoint(toLatLng(position));
  const handleOffset = offsetByBearing(center, placement.headingDeg ?? 0, HEADING_HANDLE_DISTANCE_PX);
  const handlePosition = map.layerPointToLatLng(point(handleOffset.x, handleOffset.y));

  return (
    <>
      <Polyline
        positions={[toLatLng(position), handlePosition]}
        pathOptions={{ color: SELECTED_COLOR, weight: 1.5, dashArray: "3 5", opacity: 0.8 }}
      />
      <Marker
        position={handlePosition}
        icon={headingHandleIcon(placement.headingDeg !== null)}
        draggable
        eventHandlers={{
          dragend: (event) => {
            const dropped = map.latLngToLayerPoint((event.target as LeafletMarker).getLatLng());
            const currentCenter = map.latLngToLayerPoint(toLatLng(position));
            onHeadingChange(placement.number, bearingBetween(currentCenter, dropped));
          },
        }}
      />
    </>
  );
}

interface VoteRingsProps {
  placements: FlyerPlacement[];
  votes: FlyerVotesByTapTime;
  selectedNumber: number | null;
}

function VoteRings({ placements, votes, selectedNumber }: VoteRingsProps) {
  const maxTotal = maxVoteTotal(votes);
  return (
    <>
      {placements.map((placement) => {
        const position = placementPosition(placement);
        if (!position) return null;
        const tally = votes[placement.cluster.startMs] ?? {
          tappedAtMs: placement.cluster.startMs,
          agrees: 0,
          disagrees: 0,
        };
        const thickness = ringThicknessPx(tally.agrees + tally.disagrees, maxTotal);
        return (
          <Marker
            key={placement.number}
            position={toLatLng(position)}
            icon={voteRingIcon(tally, pinSizePx(placement.number === selectedNumber) / 2, thickness)}
            interactive={false}
            zIndexOffset={-1000}
          />
        );
      })}
    </>
  );
}

function voteSummary(votes: FlyerVotesByTapTime, placement: FlyerPlacement): string {
  const tally = votes[placement.cluster.startMs];
  if (!tally) return "No votes yet";
  return `${tally.agrees + tally.disagrees} votes · ${tally.agrees} agree / ${tally.disagrees} disagree`;
}

function EstimateOffset({ placement }: { placement: FlyerPlacement }) {
  if (!placement.manualPosition || !placement.location) return null;
  return (
    <>
      <Polyline
        positions={[toLatLng(placement.location), toLatLng(placement.manualPosition)]}
        pathOptions={{ color: MOVED_COLOR, weight: 1.5, dashArray: "4 4" }}
      />
      <CircleMarker
        center={toLatLng(placement.location)}
        radius={3}
        pathOptions={{ color: MOVED_COLOR, weight: 1, fillColor: "#ffffff", fillOpacity: 1 }}
      />
    </>
  );
}

export default function FlyerLocationsMap({
  placements,
  track,
  selectedNumber,
  hoverPosition,
  votes,
  onSelect,
  onDeselect,
  onMove,
  onHeadingChange,
}: FlyerLocationsMapProps) {
  const trackPoints = useMemo(() => track.map(toLatLng), [track]);
  const selected = placements.find((placement) => placement.number === selectedNumber);
  const selectedPosition = selected && placementPosition(selected);

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height: MAP_HEIGHT_PX }}>
      <MapContainer center={[38.9072, -77.0369]} zoom={14} style={{ height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
          maxNativeZoom={19}
        />
        <FitToTrack track={trackPoints} />
        <DeselectOnMapClick onDeselect={onDeselect} />
        <Polyline positions={trackPoints} pathOptions={{ color: "#64748b", weight: 2, opacity: 0.6 }} />
        {selected?.location && (
          <Circle
            center={toLatLng(selected.location)}
            radius={selected.location.horizontalAccuracyM}
            pathOptions={{ color: SELECTED_COLOR, weight: 1, fillOpacity: 0.1 }}
          />
        )}
        {placements.map((placement) => (
          <EstimateOffset key={placement.number} placement={placement} />
        ))}
        {votes && <VoteRings placements={placements} votes={votes} selectedNumber={selectedNumber} />}
        {placements.map((placement) => {
          const position = placementPosition(placement);
          if (!position) return null;
          return (
            <Marker
              key={placement.number}
              position={toLatLng(position)}
              icon={flyerIcon(placement, placement.number === selectedNumber)}
              draggable
              eventHandlers={{
                click: () => onSelect(placement.number),
                dragend: (event) => {
                  const { lat, lng } = (event.target as LeafletMarker).getLatLng();
                  onMove(placement.number, { latitude: lat, longitude: lng });
                },
              }}
            >
              {votes && (
                <Tooltip direction="top" offset={[0, -18]}>
                  #{placement.number}: {voteSummary(votes, placement)}
                </Tooltip>
              )}
            </Marker>
          );
        })}
        {hoverPosition && (
          <CircleMarker
            center={toLatLng(hoverPosition)}
            radius={7}
            interactive={false}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: HOVER_COLOR, fillOpacity: 1 }}
          />
        )}
        {selected && selectedPosition && (
          <HeadingHandle
            key={`${selected.number}-${selected.headingDeg}`}
            placement={selected}
            position={selectedPosition}
            onHeadingChange={onHeadingChange}
          />
        )}
      </MapContainer>
    </div>
  );
}
