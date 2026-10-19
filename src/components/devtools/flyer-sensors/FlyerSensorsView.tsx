import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
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
  isDismissedSignal,
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
  ManualFlyer,
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
const NO_MANUAL_FLYERS: ManualFlyer[] = [];
const NO_DISMISSED_IDS: ReadonlySet<string> = new Set();

export function FlyerSensorsView({ savedFlyers, recording, roomId, statementId, onSave }: FlyerSensorsViewProps) {
  const [settings, setSettings] = useState<DetectionSettingsValue>(DEFAULT_SETTINGS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomWindow, setZoomWindow] = useState<TimeWindow | null>(null);
  const [adjustments, setAdjustments] = useState<FlyerAdjustments>({});
  const [hoverTimeMs, setHoverTimeMs] = useState<number | null>(null);
  const [chosenFirstFlyerGroup, setChosenFirstFlyerGroup] = useState<number | null>(null);
  const [manualFlyers, setManualFlyers] = useState<ManualFlyer[]>(NO_MANUAL_FLYERS);
  const [addingFlyers, setAddingFlyers] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(NO_DISMISSED_IDS);
  const nextManualFlyerId = useRef(1);

  const accelerometerSamples = recording?.accelerometerSamples ?? NO_SAMPLES;
  const locationFixes = recording?.locationFixes ?? NO_FIXES;
  const firstFlyerGroup = chosenFirstFlyerGroup ?? nextFlyerGroup(savedFlyers, statementId);

  const clusters = useMemo(
    () => detectTapClusters(accelerometerSamples, settings),
    [accelerometerSamples, settings],
  );

  const placements = useMemo(
    () =>
      buildFlyerPlacements(
        clusters,
        dismissedIds,
        manualFlyers,
        locationFixes,
        settings.standingWindowMs,
        adjustments,
        firstFlyerGroup,
      ),
    [clusters, dismissedIds, manualFlyers, locationFixes, settings.standingWindowMs, adjustments, firstFlyerGroup],
  );

  const hoverPosition = useMemo(
    () => (hoverTimeMs === null ? null : interpolatePosition(locationFixes, hoverTimeMs)),
    [locationFixes, hoverTimeMs],
  );

  const dismissedClusters = useMemo(
    () => clusters.filter((cluster) => isDismissedSignal(cluster, dismissedIds)),
    [clusters, dismissedIds],
  );

  const selectedPlacement = placements.find((placement) => placement.id === selectedId);
  const detectedCount = placements.filter((placement) => placement.cluster).length;
  const nearMissCount = clusters.filter((cluster) => !cluster.isSignal).length;
  const saveProblem = findSaveProblem({ roomId, statementId, placements, savedFlyers });

  const handleSettingsChange = (value: DetectionSettingsValue) => {
    setSettings(value);
    setSelectedId(null);
  };

  const handleSelectFlyer = (id: string) => {
    const placement = placements.find((candidate) => candidate.id === id);
    if (!placement) return;
    setSelectedId(id);
    if (placement.cluster) setZoomWindow(windowAroundCluster(placement.cluster, FLYER_ZOOM_PADDING_MS));
  };

  const handleAddFlyer = (position: LatLng) => {
    const id = `manual-${nextManualFlyerId.current++}`;
    setManualFlyers((current) => [...current, { id, position }]);
    setSelectedId(id);
  };

  // Flyers added by hand are deleted outright. Detected flyers are only marked as wrong, so they can be restored.
  const handleRemoveFlyer = (id: string) => {
    const isManual = manualFlyers.some((flyer) => flyer.id === id);
    if (isManual) {
      setManualFlyers((current) => current.filter((flyer) => flyer.id !== id));
      setAdjustments((current) => updateFlyerAdjustment(current, id, () => ({})));
    } else {
      setDismissedIds((current) => new Set(current).add(id));
    }
    if (selectedId === id) setSelectedId(null);
  };

  const adjustFlyer = (id: string, update: (current: FlyerAdjustment) => FlyerAdjustment) =>
    setAdjustments((current) => updateFlyerAdjustment(current, id, update));

  const handleMoveFlyer = (id: string, position: LatLng) =>
    adjustFlyer(id, (current) => ({ ...current, position }));

  const handleResetFlyerPosition = (id: string) =>
    adjustFlyer(id, (current) => ({ ...current, position: undefined }));

  const handleSetFlyerHeading = (id: string, headingDeg: number) =>
    adjustFlyer(id, (current) => ({ ...current, headingDeg }));

  const handleClearFlyerHeading = (id: string) =>
    adjustFlyer(id, (current) => ({ ...current, headingDeg: undefined }));

  const handleFlyerGroupChange = (id: string, flyerGroup: number) =>
    adjustFlyer(id, (current) => ({ ...current, flyerGroup }));

  const handleSave = async () => {
    if (roomId && statementId) await onSave(buildSavePayload(roomId, statementId, placements));
  };

  return (
    <div className="space-y-6">
      {recording && (
        <Card className="p-4 space-y-3">
          <p className="text-sm text-slate-600">
            Detected <span className="font-semibold">{detectedCount}</span> new flyers
            {nearMissCount > 0 && ` (${nearMissCount} near misses on the chart)`}
            {" "}from {accelerometerSamples.length.toLocaleString()} accelerometer samples and{" "}
            {locationFixes.length.toLocaleString()} GPS fixes.
          </p>
          {dismissedClusters.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>{dismissedClusters.length} marked as not a flyer.</span>
              <Button variant="outline" size="sm" onClick={() => setDismissedIds(NO_DISMISSED_IDS)}>
                Restore all
              </Button>
            </div>
          )}
          <div className="space-y-1 w-48">
            <Label htmlFor="flyer-sensors-first-flyer-group">First flyer number</Label>
            <Input
              id="flyer-sensors-first-flyer-group"
              type="number"
              min={1}
              step={1}
              value={firstFlyerGroup}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (Number.isInteger(parsed) && parsed > 0) setChosenFirstFlyerGroup(parsed);
              }}
            />
          </div>
          <DetectionSettings value={settings} onChange={handleSettingsChange} />
        </Card>
      )}

      <div className="space-y-2">
        <div className="heard-between">
          <p className="text-sm text-slate-600">
            {addingFlyers ? "Click the map to drop a new flyer." : "Missing a flyer? Add it on the map."}
          </p>
          <Button
            variant={addingFlyers ? "default" : "outline"}
            size="sm"
            onClick={() => setAddingFlyers((adding) => !adding)}
          >
            {addingFlyers ? "Done adding" : "Add flyers"}
          </Button>
        </div>
        <Suspense fallback={<div className="h-120 rounded-lg border bg-slate-50" />}>
          <FlyerLocationsMap
            savedFlyers={savedFlyers}
            placements={placements}
            track={locationFixes}
            selectedId={selectedId}
            hoverPosition={hoverPosition}
            addingFlyers={addingFlyers}
            onSelect={handleSelectFlyer}
            onDeselect={() => setSelectedId(null)}
            onAdd={handleAddFlyer}
            onMove={handleMoveFlyer}
            onHeadingChange={handleSetFlyerHeading}
          />
        </Suspense>
        <p className="text-xs text-slate-500">
          Dark pins are saved flyers. Their rings show votes from scans of that flyer: thicker means more votes, green is agree and red is disagree.
          {placements.length > 0 &&
            " Colored pins are new flyers: green from the recording, orange placed by hand. Drag one to correct its position, or select it and drag the handle next to it to set which way it faces."}
        </p>
      </div>

      {recording && (
        <Card className="p-4">
          <RecordingTimelineChart
            samples={accelerometerSamples}
            clusters={clusters}
            dismissedClusters={dismissedClusters}
            placements={placements}
            selectedPlacement={selectedPlacement}
            zoomWindow={zoomWindow}
            onZoomChange={setZoomWindow}
            onHoverTimeChange={setHoverTimeMs}
          />
        </Card>
      )}

      {(recording || placements.length > 0) && (
        <Card className="p-4 space-y-4">
          {placements.length > 0 && (
            <FlyerPlacementsTable
              placements={placements}
              selectedId={selectedId}
              onSelect={handleSelectFlyer}
              onFlyerGroupChange={handleFlyerGroupChange}
              onResetPosition={handleResetFlyerPosition}
              onClearHeading={handleClearFlyerHeading}
              onRemove={handleRemoveFlyer}
            />
          )}
          <SaveFlyersButton disabledReason={saveProblem} onSave={handleSave} />
        </Card>
      )}
    </div>
  );
}
