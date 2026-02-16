import { useState } from "react";
import { Button } from "../ui/button";
import { X, Wrench } from "lucide-react";
import { EmailPreviews } from "./EmailPreviews";
import { AutoPopulatorTab } from "./AutoPopulatorTab";
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

type TabType = "clustering" | "email" | "autopopulator";

export function DevTools({ user, onExit }: DevToolsProps) {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabFromUrl = parseDevToolsTabFromUrl();
    return tabFromUrl ? (tabFromUrl as TabType) : "clustering";
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
                active={activeTab === "autopopulator"}
                label="Auto Populator"
                onClick={() => handleTabChange("autopopulator")}
              />
            </div>
          </div>

          <div className="p-6">
            {activeTab === "clustering" && (
              <div className="space-y-4">
                <p className="text-slate-600">
                  Clustering visualization and testing tools
                  coming soon...
                </p>
              </div>
            )}
            {activeTab === "email" && <EmailPreviews user={user} />}
            {activeTab === "autopopulator" && <AutoPopulatorTab />}
          </div>
        </div>
      </div>
    </div>
  );
}