import { useState } from "react";
import { DebateAnalysisViewDemo } from "../components/DebateAnalysisViewDemo";
import { Button } from "../components/ui/button";
import { BarChart3 } from "lucide-react";

export function DebateAnalysisReportDemoStory() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg mb-2">Debate Analysis Report (Demo/Aspirational)</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This is the full-featured, aspirational version showing all the metrics and insights
              we could eventually track. It&apos;s powered by fake data and demonstrates the comprehensive
              analysis capabilities we&apos;re building towards.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setIsOpen(true)}
              className="w-full max-w-md"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Open Full Demo Report
            </Button>

            <div className="text-xs text-muted-foreground max-w-md">
              Aspirational Features:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Overview metrics (participants, statements, votes)</li>
                <li>AI-generated key insights with impact ratings</li>
                <li>Participation breakdown and engagement rates</li>
                <li>Voting patterns and polarization analysis</li>
                <li>Activity timeline with visual charts</li>
                <li>Top contributors and influential participants</li>
                <li>Top performing statements with consensus ratings</li>
                <li>Opinion cluster analysis</li>
                <li>Sentiment and quality metrics</li>
                <li>Trend indicators showing debate momentum</li>
              </ul>
            </div>
          </div>
        </div>
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