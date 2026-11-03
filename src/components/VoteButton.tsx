import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Button } from "./ui/button";
import type { SwipeVote } from "./flyer/FlyerSwipeCard";

interface VoteButtonProps {
  label: string;
  vote: SwipeVote;
  icon?: ReactNode;
  onClick: () => void;
}

export function VoteButton({ label, vote, icon, onClick }: VoteButtonProps) {
  // The label carries the vote color so the outline variant's hover text color can't override it.
  return (
    <Button variant="outline" size="lg" className={`border-2 px-1 ${vote}-border`} onClick={onClick}>
      <span className={`flex items-center gap-1 font-bold ${vote}-text`}>
        {icon}
        {label}
      </span>
    </Button>
  );
}

interface VoteButtonRowProps {
  onAgree: () => void;
  onDisagree: () => void;
  onPass: () => void;
}

export function VoteButtonRow({ onAgree, onDisagree, onPass }: VoteButtonRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <VoteButton label="Disagree" vote="disagree" icon={<X />} onClick={onDisagree} />
      <VoteButton label="Pass" vote="pass" onClick={onPass} />
      <VoteButton label="Agree" vote="agree" icon={<Check />} onClick={onAgree} />
    </div>
  );
}
