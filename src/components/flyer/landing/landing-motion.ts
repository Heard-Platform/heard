import { useEffect, useState } from "react";

export const EASING = {
  bounce: "cubic-bezier(.34,1.56,.64,1)",
  pop: "cubic-bezier(.34,1.8,.64,1)",
  fill: "cubic-bezier(.3,.7,.3,1)",
  fall: "cubic-bezier(.2,.6,.4,1)",
  ease: "ease",
};

export function transitionOf(property: string, durationMs: number, easing: string, delayMs: number): string {
  return `${property} ${durationMs}ms ${easing} ${delayMs}ms`;
}

export function useAnimationTrigger(delayMs: number): boolean {
  const [isTriggered, setIsTriggered] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsTriggered(true), delayMs);
    return () => clearTimeout(timeout);
  }, []);

  return isTriggered;
}
