import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
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
  chargeProgress?: MotionValue<number>;
  onAgree: () => void;
  onSuperAgree: () => void;
}

const isKeyboardClick = (event: ReactMouseEvent) => event.detail === 0;

export function ChargeableAgreeButton({
  chargeProgress: sharedChargeProgress,
  onAgree,
  onSuperAgree,
}: ChargeableAgreeButtonProps) {
  const {
    chargeProgress,
    startCharging,
    stopCharging,
    isFullyCharged,
    isPartlyCharged,
  } = useSuperAgreeCharge(sharedChargeProgress);
  const superAgreeClipPath = useTransform(
    chargeProgress,
    (progress) => `inset(0 ${100 - progress * 100}% 0 0)`,
  );

  const handlePointerDown = () => {
    startCharging(onSuperAgree);
  };

  const handlePointerUp = () => {
    const wasTap = !isFullyCharged() && !isPartlyCharged();
    stopCharging();
    if (wasTap) onAgree();
  };

  const handleClick = (event: ReactMouseEvent) => {
    if (isKeyboardClick(event)) onAgree();
  };

  const handleContextMenu = (event: ReactMouseEvent) => {
    event.preventDefault();
  };

  return (
    <div className="flex flex-col gap-1">
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
      <span className="secondary-text text-center text-xs">
        Hold for Super
      </span>
    </div>
  );
}

interface VoteButtonRowProps {
  superAgreeChargeProgress?: MotionValue<number>;
  onAgree: () => void;
  onDisagree: () => void;
  onPass: () => void;
  onSuperAgree?: () => void;
}

export function VoteButtonRow({
  superAgreeChargeProgress,
  onAgree,
  onDisagree,
  onPass,
  onSuperAgree,
}: VoteButtonRowProps) {
  return (
    <div className="grid grid-cols-3 items-start gap-2">
      <VoteButton label="Disagree" vote="disagree" icon={<X />} onClick={onDisagree} />
      <VoteButton label="Pass" vote="pass" onClick={onPass} />
      {onSuperAgree ? (
        <ChargeableAgreeButton
          chargeProgress={superAgreeChargeProgress}
          onAgree={onAgree}
          onSuperAgree={onSuperAgree}
        />
      ) : (
        <VoteButton label="Agree" vote="agree" icon={<Check />} onClick={onAgree} />
      )}
    </div>
  );
}
