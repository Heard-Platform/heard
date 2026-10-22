import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "../../ui/button";
import type { ModeratorAction } from "../../../types";
import type { DisplayView } from "../../../utils/event-display";

export type DisplayAction = Exclude<ModeratorAction, "end">;

const VIEW_OPTIONS: { view: DisplayView; label: string }[] = [
  { view: "agree-only", label: "Agree only" },
  { view: "agree-vs-disagree", label: "Agree vs disagree" },
  { view: "agree-split", label: "Agree / Split" },
];

function ControlsPanel({ isHidden, children }: { isHidden: boolean; children: ReactNode }) {
  return (
    <div
      className={`absolute inset-x-0 top-3 z-10 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-center gap-2 rounded-2xl border bg-background p-1.5 shadow-xl transition-all duration-300 ${
        isHidden
          ? "pointer-events-none -translate-y-2 opacity-0 focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100"
          : ""
      }`}
    >
      {children}
    </div>
  );
}

interface JoinControlsProps {
  isHidden: boolean;
  isBusy: boolean;
  onAction: (action: DisplayAction) => void;
}

export function JoinControls({ isHidden, isBusy, onAction }: JoinControlsProps) {
  return (
    <ControlsPanel isHidden={isHidden}>
      <Button className="font-semibold" disabled={isBusy} onClick={() => onAction("start")}>
        Start with the first post <ChevronRight />
      </Button>
    </ControlsPanel>
  );
}

interface BoardControlsProps {
  view: DisplayView;
  votingPaused: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isHidden: boolean;
  isBusy: boolean;
  onViewChange: (view: DisplayView) => void;
  onAction: (action: DisplayAction) => void;
}

export function BoardControls({
  view,
  votingPaused,
  canGoBack,
  canGoForward,
  isHidden,
  isBusy,
  onViewChange,
  onAction,
}: BoardControlsProps) {
  return (
    <ControlsPanel isHidden={isHidden}>
      <div role="group" aria-label="Display view" className="flex gap-1">
        {VIEW_OPTIONS.map((option) => (
          <Button
            key={option.view}
            variant={option.view === view ? "default" : "ghost"}
            aria-pressed={option.view === view}
            className="font-semibold"
            onClick={() => onViewChange(option.view)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="flex gap-1">
        <Button variant="outline" className="font-semibold" disabled={isBusy || !canGoBack} onClick={() => onAction("back")}>
          <ChevronLeft /> Back
        </Button>
        <Button
          variant="outline"
          className="font-semibold"
          disabled={isBusy}
          onClick={() => onAction(votingPaused ? "resume" : "pause")}
        >
          {votingPaused ? <Play /> : <Pause />}
          {votingPaused ? "Resume voting" : "Pause voting"}
        </Button>
        <Button variant="outline" className="font-semibold" disabled={isBusy || !canGoForward} onClick={() => onAction("next")}>
          Next <ChevronRight />
        </Button>
      </div>
    </ControlsPanel>
  );
}
