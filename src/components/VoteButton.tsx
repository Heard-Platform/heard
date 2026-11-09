import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { motion, useTransform } from "motion/react";
import { Check, Star, X } from "lucide-react";
import { Button } from "./ui/button";
import type { SwipeVote } from "./flyer/FlyerSwipeCard";
import { useSuperAgreeCharge } from "../hooks/useSuperAgreeCharge";

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

interface ChargeableAgreeButtonProps {
  onAgree: () => void;
  onSuperAgree: () => void;
}

const isKeyboardClick = (event: ReactMouseEvent) => event.detail === 0;

export function ChargeableAgreeButton({
  onAgree,
  onSuperAgree,
}: ChargeableAgreeButtonProps) {
  const { chargeProgress, startCharging, stopCharging, isFullyCharged } =
    useSuperAgreeCharge();
  const superAgreeClipPath = useTransform(
    chargeProgress,
    (progress) => `inset(0 ${100 - progress * 100}% 0 0)`,
  );

  const handlePointerDown = () => {
    startCharging(onSuperAgree);
  };

  const handlePointerUp = () => {
    const wasFullyCharged = isFullyCharged();
    stopCharging();
    if (!wasFullyCharged) onAgree();
  };

  const handleClick = (event: ReactMouseEvent) => {
    if (isKeyboardClick(event)) onAgree();
  };

  const handleContextMenu = (event: ReactMouseEvent) => {
    event.preventDefault();
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className="agree-border relative touch-none select-none overflow-hidden border-2 px-1"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={stopCharging}
      onPointerCancel={stopCharging}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <span className="flex items-center gap-1 font-bold agree-text">
        <Check />
        Agree
      </span>
      <motion.span
        aria-hidden
        className="super-agree-chip absolute inset-0 flex items-center justify-center gap-1 font-bold"
        style={{ clipPath: superAgreeClipPath }}
      >
        <Star className="fill-current" />
        Super
      </motion.span>
    </Button>
  );
}

interface VoteButtonRowProps {
  onAgree: () => void;
  onDisagree: () => void;
  onPass: () => void;
  onSuperAgree?: () => void;
}

export function VoteButtonRow({
  onAgree,
  onDisagree,
  onPass,
  onSuperAgree,
}: VoteButtonRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <VoteButton label="Disagree" vote="disagree" icon={<X />} onClick={onDisagree} />
      <VoteButton label="Pass" vote="pass" onClick={onPass} />
      {onSuperAgree ? (
        <ChargeableAgreeButton
          onAgree={onAgree}
          onSuperAgree={onSuperAgree}
        />
      ) : (
        <VoteButton label="Agree" vote="agree" icon={<Check />} onClick={onAgree} />
      )}
    </div>
  );
}
