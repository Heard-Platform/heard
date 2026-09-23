import { lazy, Suspense, useMemo, useState } from "react";
import { Card } from "../../ui/card";
import { DetectionSettings, type DetectionSettingsValue } from "./DetectionSettings";
import { FlyerPlacementsTable } from "./FlyerPlacementsTable";
import { RecordingTimelineChart } from "./RecordingTimelineChart";
import { RoomPicker, type RoomOption } from "./RoomPicker";
import { SaveFlyersButton } from "./SaveFlyersButton";
import { useFlyerVotes, type FlyerVotesState } from "./use-flyer-votes";
import type { FlyerVoteTally } from "./flyer-votes";
import { buildSavePayload, type FlyerPlacementsSavePayload } from "./save-payload";
import {
  buildFlyerPlacements,
  DEFAULT_STANDING_WINDOW_MS,
  interpolatePosition,
  updateFlyerAdjustment,
} from "./flyer-location";
import { DEFAULT_TAP_DETECTION_PARAMS, detectTapClusters } from "./tap-detection";
import { FLYER_ZOOM_PADDING_MS, windowAroundCluster, type TimeWindow } from "./time-window";
import type { AccelerometerSample, FlyerAdjustment, FlyerAdjustments, LatLng, LocationFix } from "./sensor-types";

const FlyerLocationsMap = lazy(() => import("./FlyerLocationsMap"));

interface FlyerSensorsViewProps {
  accelerometerSamples: AccelerometerSample[];
  locationFixes: LocationFix[];
  rooms: RoomOption[];
  roomsLoading: boolean;
  loadFlyerVotes: (roomId: string) => Promise<FlyerVoteTally[]>;
  onSave: (payload: FlyerPlacementsSavePayload) => Promise<void>;
}

function describeVotesState(state: FlyerVotesState): { text: string; isError: boolean } | null {
  switch (state.status) {
    case "idle":
      return null;
    case "loading":
      return { text: "Loading flyer votes…", isError: false };
    case "error":
      return { text: `Couldn't load flyer votes: ${state.message}`, isError: true };
    case "loaded": {
      const tallies = Object.values(state.votes);
      const total = tallies.reduce((sum, tally) => sum + tally.agrees + tally.disagrees, 0);
      return { text: `${total} flyer votes across ${tallies.length} flyers in this room`, isError: false };
    }
  }
}

const DEFAULT_SETTINGS: DetectionSettingsValue = {
  ...DEFAULT_TAP_DETECTION_PARAMS,
  standingWindowMs: DEFAULT_STANDING_WINDOW_MS,
};

export function FlyerSensorsView({
  accelerometerSamples,
  locationFixes,
  rooms,
  roomsLoading,
  loadFlyerVotes,
  onSave,
}: FlyerSensorsViewProps) {
  const [settings, setSettings] = useState<DetectionSettingsValue>(DEFAULT_SETTINGS);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [zoomWindow, setZoomWindow] = useState<TimeWindow | null>(null);
  const [adjustments, setAdjustments] = useState<FlyerAdjustments>({});
  const [roomId, setRoomId] = useState<string | null>(null);
  const [hoverTimeMs, setHoverTimeMs] = useState<number | null>(null);
  const votesState = useFlyerVotes(roomId, loadFlyerVotes);
  const votes = votesState.status === "loaded" ? votesState.votes : null;
  const votesDescription = describeVotesState(votesState);

  const clusters = useMemo(
    () => detectTapClusters(accelerometerSamples, settings),
    [accelerometerSamples, settings],
  );

  const placements = useMemo(
    () => buildFlyerPlacements(clusters, locationFixes, settings.standingWindowMs, adjustments),
    [clusters, locationFixes, settings.standingWindowMs, adjustments],
  );

  const hoverPosition = useMemo(
    () => (hoverTimeMs === null ? null : interpolatePosition(locationFixes, hoverTimeMs)),
    [locationFixes, hoverTimeMs],
  );

  const selectedPlacement = placements.find((placement) => placement.number === selectedNumber);
  const nearMissCount = clusters.filter((cluster) => !cluster.isSignal).length;

  const handleSettingsChange = (value: DetectionSettingsValue) => {
    setSettings(value);
    setSelectedNumber(null);
  };

  const findPlacement = (number: number) =>
    placements.find((placement) => placement.number === number);

  const handleSelectFlyer = (number: number) => {
    const placement = findPlacement(number);
    if (!placement) return;
    setSelectedNumber(number);
    setZoomWindow(windowAroundCluster(placement.cluster, FLYER_ZOOM_PADDING_MS));
  };

  const adjustFlyer = (number: number, update: (current: FlyerAdjustment) => FlyerAdjustment) => {
    const placement = findPlacement(number);
    if (!placement) return;
    setAdjustments((current) => updateFlyerAdjustment(current, placement.cluster, update));
  };

  const handleMoveFlyer = (number: number, position: LatLng) =>
    adjustFlyer(number, (current) => ({ ...current, position }));

  const handleResetFlyerPosition = (number: number) =>
    adjustFlyer(number, ({ headingDeg }) => ({ headingDeg }));

  const handleSetFlyerHeading = (number: number, headingDeg: number) =>
    adjustFlyer(number, (current) => ({ ...current, headingDeg }));

  const handleClearFlyerHeading = (number: number) =>
    adjustFlyer(number, ({ position }) => ({ position }));

  const saveDisabledReason = (() => {
    if (!roomId) return "Select a room to save";
    if (placements.length === 0) return "No flyers detected to save";
    return null;
  })();

  const handleSave = async () => {
    if (roomId) await onSave(buildSavePayload(roomId, placements));
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <RoomPicker rooms={rooms} loading={roomsLoading} selectedRoomId={roomId} onChange={setRoomId} />
        {votesDescription && (
          <p className={`text-xs ${votesDescription.isError ? "text-red-600" : "text-slate-500"}`}>
            {votesDescription.text}
          </p>
        )}
        <p className="text-sm text-slate-600">
          Detected <span className="font-semibold">{placements.length}</span> flyers
          {nearMissCount > 0 && ` (${nearMissCount} other spike clusters didn't match the tap count)`}
          {" "}from {accelerometerSamples.length.toLocaleString()} accelerometer samples and{" "}
          {locationFixes.length.toLocaleString()} GPS fixes.
        </p>
        <DetectionSettings value={settings} onChange={handleSettingsChange} />
        <SaveFlyersButton disabledReason={saveDisabledReason} onSave={handleSave} />
      </Card>

      <Suspense fallback={<div className="h-[480px] rounded-lg border bg-slate-50" />}>
        <FlyerLocationsMap
          placements={placements}
          track={locationFixes}
          selectedNumber={selectedNumber}
          hoverPosition={hoverPosition}
          votes={votes}
          onSelect={handleSelectFlyer}
          onDeselect={() => setSelectedNumber(null)}
          onMove={handleMoveFlyer}
          onHeadingChange={handleSetFlyerHeading}
        />
      </Suspense>
      <p className="text-xs text-slate-500 -mt-4">
        Drag a pin to correct its position. Select a pin and drag the handle next to it to set which way the flyer faces.
        {votes && " Rings show flyer votes: thicker means more votes, green is agree and red is disagree."}
      </p>

      <Card className="p-4">
        <RecordingTimelineChart
          samples={accelerometerSamples}
          clusters={clusters}
          placements={placements}
          threshold={settings.minPeakMagnitude}
          selectedPlacement={selectedPlacement}
          zoomWindow={zoomWindow}
          onZoomChange={setZoomWindow}
          onHoverTimeChange={setHoverTimeMs}
        />
      </Card>

      {placements.length > 0 && (
        <Card className="p-4">
          <FlyerPlacementsTable
            placements={placements}
            selectedNumber={selectedNumber}
            votes={votes}
            onSelect={handleSelectFlyer}
            onResetPosition={handleResetFlyerPosition}
            onClearHeading={handleClearFlyerHeading}
          />
        </Card>
      )}
    </div>
  );
}
