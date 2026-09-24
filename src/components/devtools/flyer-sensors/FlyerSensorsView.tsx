import { lazy, Suspense, useMemo, useState } from "react";
import { Card } from "../../ui/card";
import type { NewFlyerPlacementsRequest, SavedFlyerPlacement } from "../../../utils/dev-api";
import { DetectionSettings, type DetectionSettingsValue } from "./DetectionSettings";
import { FlyerPlacementsTable } from "./FlyerPlacementsTable";
import { RecordingTimelineChart } from "./RecordingTimelineChart";
import { SaveFlyersButton } from "./SaveFlyersButton";
import { buildSavePayload, findSaveProblem, nextFlyerGroup } from "./save-payload";
import {
  buildFlyerPlacements,
  DEFAULT_STANDING_WINDOW_MS,
  interpolatePosition,
  updateFlyerAdjustment,
} from "./flyer-location";
import { DEFAULT_TAP_DETECTION_PARAMS, detectTapClusters } from "./tap-detection";
import { FLYER_ZOOM_PADDING_MS, windowAroundCluster, type TimeWindow } from "./time-window";
import type {
  AccelerometerSample,
  FlyerAdjustment,
  FlyerAdjustments,
  LatLng,
  LocationFix,
  SensorRecording,
} from "./sensor-types";

const FlyerLocationsMap = lazy(() => import("./FlyerLocationsMap"));

interface FlyerSensorsViewProps {
  savedFlyers: SavedFlyerPlacement[];
  recording: SensorRecording | null;
  roomId: string | null;
  statementId: string | null;
  onSave: (request: NewFlyerPlacementsRequest) => Promise<void>;
}

const DEFAULT_SETTINGS: DetectionSettingsValue = {
  ...DEFAULT_TAP_DETECTION_PARAMS,
  standingWindowMs: DEFAULT_STANDING_WINDOW_MS,
};

const NO_SAMPLES: AccelerometerSample[] = [];
const NO_FIXES: LocationFix[] = [];

export function FlyerSensorsView({ savedFlyers, recording, roomId, statementId, onSave }: FlyerSensorsViewProps) {
  const [settings, setSettings] = useState<DetectionSettingsValue>(DEFAULT_SETTINGS);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [zoomWindow, setZoomWindow] = useState<TimeWindow | null>(null);
  const [adjustments, setAdjustments] = useState<FlyerAdjustments>({});
  const [hoverTimeMs, setHoverTimeMs] = useState<number | null>(null);

  const accelerometerSamples = recording?.accelerometerSamples ?? NO_SAMPLES;
  const locationFixes = recording?.locationFixes ?? NO_FIXES;
  const firstFlyerGroup = nextFlyerGroup(savedFlyers, statementId);

  const clusters = useMemo(
    () => detectTapClusters(accelerometerSamples, settings),
    [accelerometerSamples, settings],
  );

  const placements = useMemo(
    () => buildFlyerPlacements(clusters, locationFixes, settings.standingWindowMs, adjustments, firstFlyerGroup),
    [clusters, locationFixes, settings.standingWindowMs, adjustments, firstFlyerGroup],
  );

  const hoverPosition = useMemo(
    () => (hoverTimeMs === null ? null : interpolatePosition(locationFixes, hoverTimeMs)),
    [locationFixes, hoverTimeMs],
  );

  const selectedPlacement = placements.find((placement) => placement.number === selectedNumber);
  const nearMissCount = clusters.filter((cluster) => !cluster.isSignal).length;
  const saveProblem = findSaveProblem({ roomId, statementId, placements, savedFlyers });

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
    adjustFlyer(number, (current) => ({ ...current, position: undefined }));

  const handleSetFlyerHeading = (number: number, headingDeg: number) =>
    adjustFlyer(number, (current) => ({ ...current, headingDeg }));

  const handleClearFlyerHeading = (number: number) =>
    adjustFlyer(number, (current) => ({ ...current, headingDeg: undefined }));

  const handleFlyerGroupChange = (number: number, flyerGroup: number) =>
    adjustFlyer(number, (current) => ({ ...current, flyerGroup }));

  const handleSave = async () => {
    if (roomId && statementId) await onSave(buildSavePayload(roomId, statementId, placements));
  };

  return (
    <div className="space-y-6">
      {recording && (
        <Card className="p-4 space-y-3">
          <p className="text-sm text-slate-600">
            Detected <span className="font-semibold">{placements.length}</span> new flyers
            {nearMissCount > 0 && ` (${nearMissCount} other spike clusters didn't match the tap count)`}
            {" "}from {accelerometerSamples.length.toLocaleString()} accelerometer samples and{" "}
            {locationFixes.length.toLocaleString()} GPS fixes.
          </p>
          <DetectionSettings value={settings} onChange={handleSettingsChange} />
        </Card>
      )}

      <div className="space-y-2">
        <Suspense fallback={<div className="h-120 rounded-lg border bg-slate-50" />}>
          <FlyerLocationsMap
            savedFlyers={savedFlyers}
            placements={placements}
            track={locationFixes}
            selectedNumber={selectedNumber}
            hoverPosition={hoverPosition}
            onSelect={handleSelectFlyer}
            onDeselect={() => setSelectedNumber(null)}
            onMove={handleMoveFlyer}
            onHeadingChange={handleSetFlyerHeading}
          />
        </Suspense>
        <p className="text-xs text-slate-500">
          Dark pins are saved flyers. Their rings show votes from scans of that flyer: thicker means more votes, green is agree and red is disagree.
          {recording &&
            " Colored pins are new flyers from the recording. Drag one to correct its position, or select it and drag the handle next to it to set which way it faces."}
        </p>
      </div>

      {recording && (
        <>
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

          <Card className="p-4 space-y-4">
            {placements.length > 0 && (
              <FlyerPlacementsTable
                placements={placements}
                selectedNumber={selectedNumber}
                onSelect={handleSelectFlyer}
                onFlyerGroupChange={handleFlyerGroupChange}
                onResetPosition={handleResetFlyerPosition}
                onClearHeading={handleClearFlyerHeading}
              />
            )}
            <SaveFlyersButton disabledReason={saveProblem} onSave={handleSave} />
          </Card>
        </>
      )}
    </div>
  );
}
