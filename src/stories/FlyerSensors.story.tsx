import { useCallback, useMemo } from "react";
import { StoryContainer } from "./StoryContainer";
import { FlyerSensorsView } from "../components/devtools/flyer-sensors/FlyerSensorsView";
import { FlyerSensorsTab } from "../components/devtools/flyer-sensors/FlyerSensorsTab";
import {
  createMockFlyerVotes,
  createMockSensorRecording,
  MOCK_ROOMS,
} from "../components/devtools/flyer-sensors/flyer-sensors-mock-data";
import {
  DEFAULT_TAP_DETECTION_PARAMS,
  detectTapClusters,
} from "../components/devtools/flyer-sensors/tap-detection";
import type { FlyerVoteTally } from "../components/devtools/flyer-sensors/flyer-votes";
import type { FlyerPlacementsSavePayload } from "../components/devtools/flyer-sensors/save-payload";

const SIMULATED_LATENCY_MS = 600;

function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

async function simulateSave(payload: FlyerPlacementsSavePayload): Promise<void> {
  console.info("Flyer placements save payload", payload);
  await simulateLatency();
}

async function loadNoFlyerVotes(): Promise<FlyerVoteTally[]> {
  await simulateLatency();
  return [];
}

export function FlyerSensorsStory() {
  const dcRecording = useMemo(() => createMockSensorRecording(), []);

  const loadMockFlyerVotes = useCallback(
    async (roomId: string) => {
      const tappedAtTimes = detectTapClusters(dcRecording.accelerometerSamples, DEFAULT_TAP_DETECTION_PARAMS)
        .filter((cluster) => cluster.isSignal)
        .map((cluster) => cluster.startMs);
      await simulateLatency();
      return createMockFlyerVotes(roomId, tappedAtTimes);
    },
    [dcRecording],
  );

  return (
    <StoryContainer
      title="Flyer Sensors"
      description="Dev tools tab that finds triple-tap flyer markers in accelerometer data and maps them using GPS. Mock data is a walk around Dupont Circle, Adams Morgan and Logan Circle; stop 5 has four taps and should not be detected. Picking a room loads fake flyer votes; the housing room has none yet."
      variants={[
        {
          id: "dc-walk",
          label: "DC walk (mock data)",
          children: (
            <FlyerSensorsView
              accelerometerSamples={dcRecording.accelerometerSamples}
              locationFixes={dcRecording.locationFixes}
              rooms={MOCK_ROOMS}
              roomsLoading={false}
              loadFlyerVotes={loadMockFlyerVotes}
              onSave={simulateSave}
            />
          ),
        },
        {
          id: "upload",
          label: "Upload (empty)",
          children: (
            <FlyerSensorsTab
              rooms={MOCK_ROOMS}
              roomsLoading={false}
              loadFlyerVotes={loadNoFlyerVotes}
              onSave={simulateSave}
            />
          ),
        },
      ]}
    />
  );
}
