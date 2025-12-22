import { useState } from "react";
import { DebateAnalysisViewDemo } from "../components/analysis/DebateAnalysisViewDemo";
import { Button } from "../components/ui/button";
import { BarChart3 } from "lucide-react";

export function DebateAnalysisReportDemoStory() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full max-w-md"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Open Full Demo Report
        </Button>
      </div>

      {isOpen && (
        <DebateAnalysisViewDemo
          roomId="demo-room-id-12345"
          debateTopic="Community Development Priorities"
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}