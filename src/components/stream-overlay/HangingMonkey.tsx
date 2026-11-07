import type { ReactNode } from "react";
import monkeyImg from "../../assets/avatar-monkey.png";
import "./stream-overlay.css";

export type MonkeyMotion = "climbingUp" | "climbingDown";

const MOTION_CLASS_NAMES: Record<MonkeyMotion, string> = {
  climbingUp: "monkey-climbing-up",
  climbingDown: "monkey-climbing-down",
};

interface HangingMonkeyProps {
  motion: MonkeyMotion;
  speechBubble: ReactNode;
  onClimbDownEnd: () => void;
}

export function HangingMonkey({
  motion,
  speechBubble,
  onClimbDownEnd,
}: HangingMonkeyProps) {
  const handleAnimationEnd = (event: React.AnimationEvent) => {
    const isOwnClimbDown =
      event.target === event.currentTarget &&
      motion === "climbingDown";
    if (isOwnClimbDown) onClimbDownEnd();
  };

  return (
    <div
      className={`hanging-monkey ${MOTION_CLASS_NAMES[motion]}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="monkey-speech-bubble-slot">{speechBubble}</div>
      <div className="hanging-monkey-swing">
        <img
          className="hanging-monkey-image"
          src={monkeyImg}
          alt="Monkey hanging on the vine"
        />
      </div>
    </div>
  );
}
