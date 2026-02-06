import { useState } from "react";
import { SidePanelMenu } from "../components/SidePanelMenu";
import { StoryContainer } from "./StoryContainer";
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

export default function SidePanelMenuStory() {
  const variants = [
    { id: "unverified", label: "Unverified User" },
  ];

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

  return (
    <div className="p-8 min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <StoryContainer
        title="SidePanelMenu"
        description="Side panel menu showing unverified user with verification prompt"
        variants={variants}
      >
        <div className="flex items-center justify-center p-12">
          <SidePanelMenu
            user={mockUser}
            onLogout={handleLogout}
            onOpenHelp={handleOpenHelp}
            onShowAccountSetupModal={handleShowAccountSetupModal}
            onOpenFeatureTracker={() => alert("Open Feature Tracker clicked")}
          />
        </div>
      </StoryContainer>
    </div>
  );
}
