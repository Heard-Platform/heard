import { useState } from "react";
import { QRScanResultDialog } from "../components/room/QRScanResultDialog";
import { Button } from "../components/ui/button";
import { QrCode } from "lucide-react";
import { DebateRoom, VoteTypeNew, VoteType } from "../types";

export function QRScanResultDialogStory() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scenario, setScenario] = useState<VoteType>("agree");

  const mockRoom: DebateRoom = {
    id: "test-room-123",
    topic: "Should we close Q Street to cars?",
    description: "A debate about urban planning",
    phase: "lobby",
    subPhase: "voting",
    gameNumber: 1,
    roundStartTime: Date.now(),
    participants: [],
    hostId: "test-host",
    isActive: true,
    createdAt: Date.now(),
    mode: "realtime",
  };

  const scenarios: Record<VoteTypeNew, { topic: string; agreePercent: number; disagreePercent: number; passPercent: number; userVote: VoteTypeNew }> = {
    agree: {
      topic: "Should we close Q Street to cars?",
      agreePercent: 62,
      disagreePercent: 28,
      passPercent: 10,
      userVote: "agree",
    },
    disagree: {
      topic: "Is pineapple acceptable on pizza?",
      agreePercent: 35,
      disagreePercent: 55,
      passPercent: 10,
      userVote: "disagree",
    },
    pass: {
      topic: "Should the city ban gas stoves?",
      agreePercent: 42,
      disagreePercent: 38,
      passPercent: 20,
      userVote: "pass",
    },
  };

  // @ts-ignore
  const currentScenario = scenarios[scenario];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Scan Result Dialog
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          This dialog appears after a user scans a flyer QR code and their vote is recorded. It shows them how their vote stacks up with others and encourages them to join the full discussion.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Select Vote Scenario
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => setScenario("agree")}
                variant={scenario === "agree" ? "default" : "outline"}
                size="sm"
                className={
                  scenario === "agree"
                    ? "bg-green-500 hover:bg-green-600"
                    : ""
                }
              >
                Agreed
              </Button>
              <Button
                onClick={() => setScenario("disagree")}
                variant={scenario === "disagree" ? "default" : "outline"}
                size="sm"
                className={
                  scenario === "disagree"
                    ? "bg-red-500 hover:bg-red-600"
                    : ""
                }
              >
                Disagreed
              </Button>
              <Button
                onClick={() => setScenario("pass")}
                variant={scenario === "pass" ? "default" : "outline"}
                size="sm"
                className={
                  scenario === "pass"
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : ""
                }
              >
                Unsure
              </Button>
            </div>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            className="w-full"
          >
            Trigger Dialog
          </Button>

          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm text-slate-700">
              Current Scenario:
            </h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>
                <strong>Topic:</strong> {currentScenario.topic}
              </li>
              <li>
                <strong>User Vote:</strong> {currentScenario.userVote}
              </li>
              <li>
                <strong>Results:</strong> {currentScenario.agreePercent}%
                agree, {currentScenario.disagreePercent}% disagree,{" "}
                {currentScenario.passPercent}% unsure
              </li>
            </ul>
          </div>
        </div>
      </div>

      <QRScanResultDialog
        room={{ ...mockRoom, topic: currentScenario.topic }}
        agreePercent={currentScenario.agreePercent}
        disagreePercent={currentScenario.disagreePercent}
        passPercent={currentScenario.passPercent}
        userVote={currentScenario.userVote}
        isOpen={dialogOpen}
        onEmailSubmit={async () => console.log("Email submitted")}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}