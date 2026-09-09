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

export default function SidePanelMenuStory() {
  const handleLogout = () => {
    console.log("Logout clicked");
    alert("Logout clicked");
  };

  const handleOpenHelp = () => {
    console.log("Help clicked");
    alert("Help clicked");
  };

  const handleShowAccountSetupModal = (featureText: string) => {
    console.log("Show account setup modal:", featureText);
    alert(`Show account setup modal: ${featureText}`);
  };

  const variants = [
    {
      id: "unverified",
      label: "Unverified User",
      children: (
        <div className="flex items-center justify-center p-12">
          <RoomAlertsProvider>
            <SidePanelMenu
              user={mockUser}
              onLogout={handleLogout}
              onOpenHelp={handleOpenHelp}
              onShowAccountSetupModal={handleShowAccountSetupModal}
              onOpenFeatureTracker={() => alert("Open Feature Tracker clicked")}
              onJumpToRoom={(roomId) => alert(`Jump to room: ${roomId}`)}
            />
          </RoomAlertsProvider>
        </div>
      ),
    },
    {
      id: "unsubbed",
      label: "Unsubbed from Updates",
      children: (
        <div className="flex items-center justify-center p-12">
          <RoomAlertsProvider>
            <SidePanelMenu
              user={unsubbedMockUser}
              onLogout={handleLogout}
              onOpenHelp={handleOpenHelp}
              onShowAccountSetupModal={handleShowAccountSetupModal}
              onOpenFeatureTracker={() => alert("Open Feature Tracker clicked")}
              onJumpToRoom={(roomId) => alert(`Jump to room: ${roomId}`)}
            />
          </RoomAlertsProvider>
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
