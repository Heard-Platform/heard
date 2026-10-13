import type { CSSProperties } from "react";
import { EASING, transitionOf, useAnimationTrigger } from "../landing/landing-motion";

const TRIGGER_DELAY_MS = 150;

/** Returns a style builder that fades and lifts an element into place after mount, staggered by delay. */
export function useRiseIn(): (delayMs: number) => CSSProperties {
  const isTriggered = useAnimationTrigger(TRIGGER_DELAY_MS);

  return (delayMs) => ({
    opacity: isTriggered ? 1 : 0,
    transform: isTriggered ? "translateY(0)" : "translateY(14px)",
    transition: [
      transitionOf("opacity", 400, EASING.ease, delayMs),
      transitionOf("transform", 550, EASING.bounce, delayMs),
    ].join(", "),
  });
}
