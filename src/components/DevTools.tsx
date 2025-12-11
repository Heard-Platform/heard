import { useState } from "react";
import { Button } from "./ui/button";
import { X, Wrench } from "lucide-react";

interface DevToolsProps {
  onExit?: () => void;
}

type TabType = "clustering";

export function DevTools({ onExit }: DevToolsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("clustering");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-6 border-b">
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
              <button
                onClick={() => setActiveTab("clustering")}
                className={`px-4 py-3 border-b-2 transition-colors ${
                  activeTab === "clustering"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Clustering
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "clustering" && (
              <div className="space-y-4">
                <p className="text-slate-600">Clustering visualization and testing tools coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
