import { useState } from "react";
import { Button } from "../ui/button";
import { X, Wrench } from "lucide-react";
import { EmailPreviews } from "./EmailPreviews";
import { EmailMonitoringTabContainer } from "./email-monitor/EmailMonitoringTabContainer";
import { EnrichmentTab } from "./EnrichmentTab";
import { PostsTab } from "./PostsTab";
import { FlyersTab } from "./FlyersTab";
import { VoteMatrixTab } from "./VoteMatrixTab";
import { VoteStatsTab } from "./VoteStatsTab";
import { ReferralEventsTab } from "./ReferralEventsTab";
import { SessionsTab } from "./SessionsTab";
import { PerformanceTestTab } from "./PerformanceTestTab";
import { TestingTab } from "./TestingTab";
import { NotificationSystemTab } from "./NotificationSystemTab";
import { TabButton } from "./TabButton";
import {
  parseDevToolsTabFromUrl,
  updateUrlForDevTools,
} from "../../utils/url";
import type { UserSession } from "../../types";

interface DevToolsProps {
  user: UserSession;
  onExit?: () => void;
}

type TabType = "vote-matrix" | "clustering" | "email" | "email-monitoring" | "notification-system" | "enrichment" | "posts" | "flyers" | "vote-stats" | "referral-events" | "session" | "performance" | "testing";

export function DevTools({ user, onExit }: DevToolsProps) {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabFromUrl = parseDevToolsTabFromUrl();
    return tabFromUrl ? (tabFromUrl as TabType) : "vote-matrix";
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    updateUrlForDevTools(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="heard-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Wrench className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl">Dev Tools</h1>
            </div>
            {onExit && (
              <Button
                onClick={onExit}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Exit
              </Button>
            )}
          </div>

          <div className="border-b">
            <div className="flex gap-1 px-6">
              <TabButton
                active={activeTab === "vote-matrix"}
                label="Vote Matrix"
                onClick={() => handleTabChange("vote-matrix")}
              />
              <TabButton
                active={activeTab === "clustering"}
                label="Clustering"
                onClick={() => handleTabChange("clustering")}
              />
              <TabButton
                active={activeTab === "email"}
                label="Email"
                onClick={() => handleTabChange("email")}
              />
              <TabButton
                active={activeTab === "email-monitoring"}
                label="Email Monitoring"
                onClick={() => handleTabChange("email-monitoring")}
              />
              <TabButton
                active={activeTab === "notification-system"}
                label="Notification System"
                onClick={() => handleTabChange("notification-system")}
              />
              <TabButton
                active={activeTab === "enrichment"}
                label="Enrichment Service"
                onClick={() => handleTabChange("enrichment")}
              />
              <TabButton
                active={activeTab === "posts"}
                label="Posts"
                onClick={() => handleTabChange("posts")}
              />
              <TabButton
                active={activeTab === "flyers"}
                label="Flyers"
                onClick={() => handleTabChange("flyers")}
              />
              <TabButton
                active={activeTab === "vote-stats"}
                label="Vote Stats"
                onClick={() => handleTabChange("vote-stats")}
              />
              <TabButton
                active={activeTab === "referral-events"}
                label="Referral Events"
                onClick={() => handleTabChange("referral-events")}
              />
              <TabButton
                active={activeTab === "session"}
                label="Session"
                onClick={() => handleTabChange("session")}
              />
              <TabButton
                active={activeTab === "performance"}
                label="Performance"
                onClick={() => handleTabChange("performance")}
              />
              <TabButton
                active={activeTab === "testing"}
                label="Testing"
                onClick={() => handleTabChange("testing")}
              />
            </div>
          </div>

          <div className="p-6">
            {activeTab === "vote-matrix" && <VoteMatrixTab />}
            {activeTab === "clustering" && (
              <div className="space-y-4">
                <p className="text-slate-600">
                  Clustering visualization and testing tools
                  coming soon...
                </p>
              </div>
            )}
            {activeTab === "email" && <EmailPreviews user={user} />}
            {activeTab === "email-monitoring" && (
              <EmailMonitoringTabContainer />
            )}
            {activeTab === "notification-system" && (
              <NotificationSystemTab user={user} />
            )}
            {activeTab === "enrichment" && <EnrichmentTab />}
            {activeTab === "posts" && <PostsTab />}
            {activeTab === "flyers" && <FlyersTab />}
            {activeTab === "vote-stats" && <VoteStatsTab />}
            {activeTab === "referral-events" && <ReferralEventsTab />}
            {activeTab === "session" && <SessionsTab />}
            {activeTab === "performance" && <PerformanceTestTab />}
            {activeTab === "testing" && <TestingTab />}
          </div>
        </div>
      </div>
    </div>
  );
}