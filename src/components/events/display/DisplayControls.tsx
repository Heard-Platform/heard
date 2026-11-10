import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Eye,
  EyeOff,
  Pause,
  Play,
  Users,
} from "lucide-react";
import { Button } from "../../ui/button";
import type { ModeratorAction } from "../../../types";
import type { DisplayView } from "../../../utils/event-display";

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
  areDoorsOpen: boolean;
  peopleHere: number;
  isHidden: boolean;
  isBusy: boolean;
  onAction: (action: ModeratorAction) => void;
  onShowAudienceBreakdown: () => void;
  onHideScreen: () => void;
}

export function JoinControls({
  areDoorsOpen,
  peopleHere,
  isHidden,
  isBusy,
  onAction,
  onShowAudienceBreakdown,
  onHideScreen,
}: JoinControlsProps) {
  if (!areDoorsOpen) {
    return (
      <ControlsPanel isHidden={isHidden}>
        <CommonButtons
          headcountText="Doors closed"
          onShowAudienceBreakdown={onShowAudienceBreakdown}
          onHideScreen={onHideScreen}
        />
        <Button className="font-semibold" disabled={isBusy} onClick={() => onAction("open")}>
          Open doors <DoorOpen />
        </Button>
      </ControlsPanel>
    );
  }

  return (
    <ControlsPanel isHidden={isHidden}>
      <CommonButtons
        headcountText={`${peopleHere} here`}
        onShowAudienceBreakdown={onShowAudienceBreakdown}
        onHideScreen={onHideScreen}
      />
      <Button className="font-semibold" disabled={isBusy} onClick={() => onAction("start")}>
        Start with the first prompt <ChevronRight />
      </Button>
    </ControlsPanel>
  );
}

interface IntroControlsProps {
  peopleHere: number;
  canGoBack: boolean;
  isHidden: boolean;
  isBusy: boolean;
  onAction: (action: ModeratorAction) => void;
  onShowAudienceBreakdown: () => void;
  onHideScreen: () => void;
}

export function IntroControls({
  peopleHere,
  canGoBack,
  isHidden,
  isBusy,
  onAction,
  onShowAudienceBreakdown,
  onHideScreen,
}: IntroControlsProps) {
  return (
    <ControlsPanel isHidden={isHidden}>
      <CommonButtons
        headcountText={`${peopleHere} here`}
        onShowAudienceBreakdown={onShowAudienceBreakdown}
        onHideScreen={onHideScreen}
      />
      <Button
        variant="outline"
        className="font-semibold"
        disabled={isBusy || !canGoBack}
        onClick={() => onAction("back")}
      >
        <ChevronLeft /> Back
      </Button>
      <Button
        className="font-semibold"
        disabled={isBusy}
        onClick={() => onAction("start-voting")}
      >
        <Play /> Start voting
      </Button>
    </ControlsPanel>
  );
}

interface BoardControlsProps {
  view: DisplayView;
  votingPaused: boolean;
  peopleHere: number;
  finishedCurrentPost: number;
  canGoBack: boolean;
  isLastPost: boolean;
  isHidden: boolean;
  isBusy: boolean;
  onViewChange: (view: DisplayView) => void;
  onAction: (action: ModeratorAction) => void;
  onEndRequest: () => void;
  onShowAudienceBreakdown: () => void;
  onHideScreen: () => void;
}

export function BoardControls({
  view,
  votingPaused,
  peopleHere,
  finishedCurrentPost,
  canGoBack,
  isLastPost,
  isHidden,
  isBusy,
  onViewChange,
  onAction,
  onEndRequest,
  onShowAudienceBreakdown,
  onHideScreen,
}: BoardControlsProps) {
  return (
    <ControlsPanel isHidden={isHidden}>
      <CommonButtons
        headcountText={`${peopleHere} here · ${finishedCurrentPost} finished this one`}
        onShowAudienceBreakdown={onShowAudienceBreakdown}
        onHideScreen={onHideScreen}
      />
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
        {isLastPost ? (
          <Button variant="destructive" className="font-semibold" disabled={isBusy} onClick={onEndRequest}>
            End session
          </Button>
        ) : (
          <Button variant="outline" className="font-semibold" disabled={isBusy} onClick={() => onAction("next")}>
            Next <ChevronRight />
          </Button>
        )}
      </div>
    </ControlsPanel>
  );
}

interface PrivacyScreenControlsProps {
  isHidden: boolean;
  onShowScreen: () => void;
}

export function PrivacyScreenControls({
  isHidden,
  onShowScreen,
}: PrivacyScreenControlsProps) {
  return (
    <ControlsPanel isHidden={isHidden}>
      <Button className="font-semibold" onClick={onShowScreen}>
        <Eye /> Show screen
      </Button>
    </ControlsPanel>
  );
}

interface CommonButtonsProps {
  headcountText: string;
  onShowAudienceBreakdown: () => void;
  onHideScreen: () => void;
}

function CommonButtons({
  headcountText,
  onShowAudienceBreakdown,
  onHideScreen,
}: CommonButtonsProps) {
  return (
    <>
      <HeadcountLabel text={headcountText} />
      <AudienceBreakdownButton onClick={onShowAudienceBreakdown} />
      <HideScreenButton onClick={onHideScreen} />
    </>
  );
}

function HideScreenButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Hide screen (B)"
      title="Hide screen (B)"
      onClick={onClick}
    >
      <EyeOff />
    </Button>
  );
}

function AudienceBreakdownButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Who's in the room"
      title="Who's in the room"
      onClick={onClick}
    >
      <Users />
    </Button>
  );
}

function HeadcountLabel({ text }: { text: string }) {
  return <span className="px-2 text-sm font-semibold tabular-nums text-muted-foreground">{text}</span>;
}
