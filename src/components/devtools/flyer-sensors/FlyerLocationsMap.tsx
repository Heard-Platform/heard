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
import type { SavedFlyerPlacement } from "../../../utils/dev-api";
import { placementPosition } from "./flyer-location";
import { describeVotes, maxVoteTotal, ringThicknessPx } from "./flyer-votes";
import { bearingBetween, offsetByBearing } from "./heading";
import { voteRingIcon } from "./vote-ring-icon";
import type { FlyerPlacement, LatLng, LocationFix } from "./sensor-types";

interface FlyerLocationsMapProps {
  savedFlyers: SavedFlyerPlacement[];
  placements: FlyerPlacement[];
  track: LocationFix[];
  selectedNumber: number | null;
  hoverPosition: LatLng | null;
  onSelect: (number: number) => void;
  onDeselect: () => void;
  onMove: (number: number, position: LatLng) => void;
  onHeadingChange: (number: number, headingDeg: number) => void;
}

interface PinIconOptions {
  label: number;
  color: string;
  selected: boolean;
  headingDeg: number | null;
  draggable: boolean;
}

const MAP_HEIGHT_PX = 480;
const MARKER_SIZE_PX = 26;
const DC_CENTER: LatLngExpression = [38.9072, -77.0369];
const ESTIMATED_COLOR = "#16a34a";
const MOVED_COLOR = "#ea580c";
const SELECTED_COLOR = "#2563eb";
const SAVED_COLOR = "#334155";
const HOVER_COLOR = "#9333ea";
const HEADING_HANDLE_DISTANCE_PX = 56;
const HEADING_HANDLE_SIZE_PX = 16;

function toLatLng(point: LatLng): LatLngExpression {
  return [point.latitude, point.longitude];
}

function newFlyerColor(placement: FlyerPlacement, selected: boolean): string {
  if (selected) return SELECTED_COLOR;
  return placement.manualPosition ? MOVED_COLOR : ESTIMATED_COLOR;
}

function headingArrowHtml(headingDeg: number, color: string): string {
  return `<div style="position:absolute;inset:0;transform:rotate(${headingDeg}deg);pointer-events:none;"><div style="position:absolute;left:50%;top:-11px;margin-left:-7px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid ${color};"></div></div>`;
}

function pinSizePx(selected: boolean): number {
  return selected ? MARKER_SIZE_PX + 6 : MARKER_SIZE_PX;
}

function pinIcon({ label, color, selected, headingDeg, draggable }: PinIconOptions) {
  const size = pinSizePx(selected);
  const arrow = headingDeg === null ? "" : headingArrowHtml(headingDeg, color);
  return divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="position:relative;width:${size}px;height:${size}px;">${arrow}<div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);color:#fff;font:600 11px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;cursor:${draggable ? "grab" : "default"};">${label}</div></div>`,
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

function FitToPoints({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) map.fitBounds(latLngBounds(points), { padding: [32, 32], maxZoom: 18 });
  }, [map, points]);
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

function SavedFlyerPins({ savedFlyers }: { savedFlyers: SavedFlyerPlacement[] }) {
  const maxTotal = maxVoteTotal(savedFlyers);
  const pinRadius = pinSizePx(false) / 2;
  return (
    <>
      {savedFlyers.map((flyer) => (
        <Marker
          key={`ring-${flyer.id}`}
          position={toLatLng(flyer)}
          icon={voteRingIcon(flyer, pinRadius, ringThicknessPx(flyer.agrees + flyer.disagrees, maxTotal))}
          interactive={false}
          zIndexOffset={-1000}
        />
      ))}
      {savedFlyers.map((flyer) => (
        <Marker
          key={flyer.id}
          position={toLatLng(flyer)}
          icon={pinIcon({
            label: flyer.flyerGroup,
            color: SAVED_COLOR,
            selected: false,
            headingDeg: flyer.headingDeg,
            draggable: false,
          })}
        >
          <Tooltip direction="top" offset={[0, -18]}>
            Flyer {flyer.flyerGroup}: {describeVotes(flyer)}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
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
  savedFlyers,
  placements,
  track,
  selectedNumber,
  hoverPosition,
  onSelect,
  onDeselect,
  onMove,
  onHeadingChange,
}: FlyerLocationsMapProps) {
  const trackPoints = useMemo(() => track.map(toLatLng), [track]);
  const fitPoints = useMemo(
    () => (trackPoints.length > 0 ? trackPoints : savedFlyers.map(toLatLng)),
    [trackPoints, savedFlyers],
  );
  const selected = placements.find((placement) => placement.number === selectedNumber);
  const selectedPosition = selected && placementPosition(selected);

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height: MAP_HEIGHT_PX }}>
      <MapContainer center={DC_CENTER} zoom={14} style={{ height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
          maxNativeZoom={19}
        />
        <FitToPoints points={fitPoints} />
        <DeselectOnMapClick onDeselect={onDeselect} />
        <Polyline positions={trackPoints} pathOptions={{ color: "#64748b", weight: 2, opacity: 0.6 }} />
        <SavedFlyerPins savedFlyers={savedFlyers} />
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
        {placements.map((placement) => {
          const position = placementPosition(placement);
          if (!position) return null;
          const isSelected = placement.number === selectedNumber;
          return (
            <Marker
              key={placement.number}
              position={toLatLng(position)}
              icon={pinIcon({
                label: placement.flyerGroup,
                color: newFlyerColor(placement, isSelected),
                selected: isSelected,
                headingDeg: placement.headingDeg,
                draggable: true,
              })}
              draggable
              eventHandlers={{
                click: () => onSelect(placement.number),
                dragend: (event) => {
                  const { lat, lng } = (event.target as LeafletMarker).getLatLng();
                  onMove(placement.number, { latitude: lat, longitude: lng });
                },
              }}
            />
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
