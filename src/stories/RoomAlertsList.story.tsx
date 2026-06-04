import { ReactNode, useState } from "react";
import { RoomAlertsList } from "../components/side-panel/RoomAlertsList";
import { StoryContainer } from "./StoryContainer";
import { RoomAlertsContext } from "../contexts/RoomAlertsContext";
import type { RoomAlert } from "../types";

function MockRoomAlertsProvider({
  initialAlerts,
  children,
}: {
  initialAlerts: RoomAlert[];
  children: ReactNode;
}) {
  const [alerts, setAlerts] = useState<RoomAlert[]>(initialAlerts);

  const clearAlert = (roomId: string) => {
    setAlerts((prev) => prev.filter((a) => a.roomId !== roomId));
  };

  const refresh = async () => {
    setAlerts(initialAlerts);
  };

  return (
    <RoomAlertsContext.Provider value={{ alerts, clearAlert, refresh }}>
      {children}
    </RoomAlertsContext.Provider>
  );
}

const handleJumpToRoom = (roomId: string) => {
  alert(`Jump to room: ${roomId}`);
};

const fewAlerts: RoomAlert[] = [
  {
    roomId: "room-1",
    topic: "Should we have term limits for senators?",
    emoji: "🗳️",
    reason: "new-activity",
    lastActivityAt: Date.now() - 1000 * 60 * 5,
  },
  {
    roomId: "room-2",
    topic: "Is universal basic income a good idea?",
    emoji: "💸",
    reason: "ended",
    lastActivityAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    roomId: "room-3",
    topic: "Should AI be regulated like nuclear technology?",
    emoji: "🤖",
    reason: "new-activity",
    lastActivityAt: Date.now() - 1000 * 60 * 30,
  },
];

const manyAlerts: RoomAlert[] = Array.from({ length: 20 }, (_, i) => ({
  roomId: `room-many-${i}`,
  topic: `Long-running debate topic number ${i + 1} that demonstrates scroll behaviour`,
  emoji: ["🗳️", "💸", "🤖", "🏛️", "📊"][i % 5],
  reason: i % 3 === 0 ? "ended" : "new-activity",
  lastActivityAt: Date.now() - 1000 * 60 * (i + 1),
}));

export default function RoomAlertsListStory() {
  return (
    <div className="p-8 min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <StoryContainer
        title="RoomAlertsList"
        description="Updates section shown in the side panel. Tap a row to jump, or the X to dismiss without navigating."
        variants={[
          {
            id: "with-alerts",
            label: "With alerts",
            children: (
              <MockRoomAlertsProvider initialAlerts={fewAlerts}>
                <div className="max-w-sm">
                  <RoomAlertsList onJumpToRoom={handleJumpToRoom} />
                </div>
              </MockRoomAlertsProvider>
            ),
          },
          {
            id: "empty",
            label: "Empty state",
            children: (
              <MockRoomAlertsProvider initialAlerts={[]}>
                <div className="max-w-sm">
                  <RoomAlertsList onJumpToRoom={handleJumpToRoom} />
                </div>
              </MockRoomAlertsProvider>
            ),
          },
          {
            id: "many",
            label: "Many alerts (scrolls)",
            children: (
              <MockRoomAlertsProvider initialAlerts={manyAlerts}>
                <div className="max-w-sm">
                  <RoomAlertsList onJumpToRoom={handleJumpToRoom} />
                </div>
              </MockRoomAlertsProvider>
            ),
          },
        ]}
      />
    </div>
  );
}
