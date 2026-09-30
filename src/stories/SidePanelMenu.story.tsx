import { useState } from "react";
import { SidePanelMenu } from "../components/SidePanelMenu";
import { StoryContainer } from "./StoryContainer";
import { RoomAlertsProvider } from "../contexts/RoomAlertsContext";
import type { UserSession } from "../types";

const mockUser: UserSession = {
  id: "user-123",
  nickname: "TestUser",
  email: "test@example.com",
  score: 42,
  streak: 3,
  lastActive: Date.now(),
  createdAt: Date.now() - 86400000,
  isAnonymous: false,
  phoneVerified: false,
  isTestUser: false,
  isDeveloper: false,
};

const unsubbedMockUser: UserSession = {
  ...mockUser,
  id: "user-456",
  nickname: "UnsubbedUser",
  phoneVerified: true,
  isUnsubbedFromUpdates: true,
};

function SidePanelMenuDemo({ user }: { user: UserSession }) {
  const [open, setOpen] = useState(false);

  return (
    <RoomAlertsProvider>
      <button
        className="rounded-full border border-gray-200 bg-white px-4 py-2 shadow"
        onClick={() => setOpen(true)}
      >
        Open menu
      </button>
      <SidePanelMenu
        user={user}
        open={open}
        onOpenChange={setOpen}
        onLogout={() => alert("Logout clicked")}
        onOpenHelp={() => alert("Help clicked")}
        onOpenRetentionDashboard={() => alert("Open Retention Dashboard clicked")}
        onOpenFeatureTracker={() => alert("Open Feature Tracker clicked")}
        onOpenActivityFeed={() => alert("Open Activity Feed clicked")}
        onShowAccountSetupModal={(featureText) =>
          alert(`Show account setup modal: ${featureText}`)
        }
        onJumpToRoom={(roomId) => alert(`Jump to room: ${roomId}`)}
      />
    </RoomAlertsProvider>
  );
}

export default function SidePanelMenuStory() {
  const variants = [
    {
      id: "unverified",
      label: "Unverified User",
      children: (
        <div className="flex items-center justify-center p-12">
          <SidePanelMenuDemo user={mockUser} />
        </div>
      ),
    },
    {
      id: "unsubbed",
      label: "Unsubbed from Updates",
      children: (
        <div className="flex items-center justify-center p-12">
          <SidePanelMenuDemo user={unsubbedMockUser} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <StoryContainer
        title="SidePanelMenu"
        description="Side panel menu showing unverified and newsletter-unsubbed user states"
        variants={variants}
      />
    </div>
  );
}
