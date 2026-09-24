import { useMemo } from "react";
import { StoryContainer } from "./StoryContainer";
import { FlyerSensorsTab } from "../components/devtools/flyer-sensors/FlyerSensorsTab";
import {
  createMockFlyerBackend,
  createMockSensorRecording,
  MOCK_ROOMS,
} from "../components/devtools/flyer-sensors/flyer-sensors-mock-data";

export function FlyerSensorsStory() {
  const dcRecording = useMemo(() => createMockSensorRecording(), []);
  const backend = useMemo(() => createMockFlyerBackend(), []);

  return (
    <StoryContainer
      title="Flyer Sensors"
      description="Dev tools tab for saved flyer placements and their scan votes, plus adding new flyers from phone sensor recordings. The fake backend has saved flyers for the bike lanes and Adams Morgan rooms and none for the housing room; saves are kept until the page reloads. The sample recording is a walk around Dupont Circle, Adams Morgan and Logan Circle; stop 5 has four taps and should not be detected."
      variants={[
        {
          id: "with-recording",
          label: "Saved flyers + sample recording",
          children: (
            <FlyerSensorsTab
              rooms={MOCK_ROOMS}
              roomsLoading={false}
              initialRecording={dcRecording}
              loadRoomFlyers={backend.loadRoomFlyers}
              saveFlyers={backend.saveFlyers}
            />
          ),
        },
        {
          id: "saved-only",
          label: "Saved flyers only",
          children: (
            <FlyerSensorsTab
              rooms={MOCK_ROOMS}
              roomsLoading={false}
              loadRoomFlyers={backend.loadRoomFlyers}
              saveFlyers={backend.saveFlyers}
            />
          ),
        },
      ]}
    />
  );
}
