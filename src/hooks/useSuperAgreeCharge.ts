import { useCallback, useEffect, useRef } from "react";
import {
  animate,
  useMotionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react";

export const SUPER_AGREE_CHARGE_DELAY_MS = 150;
export const SUPER_AGREE_CHARGE_MS = 900;
const CHARGED_VIBRATION_MS = 30;

export interface SuperAgreeCharge {
  chargeProgress: MotionValue<number>;
  startCharging: (onCharged: () => void) => void;
  stopCharging: () => void;
  isFullyCharged: () => boolean;
  isPartlyCharged: () => boolean;
}

export function useSuperAgreeCharge(
  sharedChargeProgress?: MotionValue<number>,
): SuperAgreeCharge {
  const ownChargeProgress = useMotionValue(0);
  const chargeProgress = sharedChargeProgress ?? ownChargeProgress;
  const chargeAnimation = useRef<AnimationPlaybackControls | null>(
    null,
  );
  const isFullyChargedRef = useRef(false);

  const startCharging = useCallback(
    (onCharged: () => void) => {
      if (chargeAnimation.current) return;
      chargeAnimation.current = animate(chargeProgress, 1, {
        duration: SUPER_AGREE_CHARGE_MS / 1000,
        delay: SUPER_AGREE_CHARGE_DELAY_MS / 1000,
        ease: "linear",
        onComplete: () => {
          isFullyChargedRef.current = true;
          navigator.vibrate?.(CHARGED_VIBRATION_MS);
          onCharged();
        },
      });
    },
    [chargeProgress],
  );

  const stopCharging = useCallback(() => {
    chargeAnimation.current?.stop();
    chargeAnimation.current = null;
    isFullyChargedRef.current = false;
    chargeProgress.set(0);
  }, [chargeProgress]);

  const isFullyCharged = useCallback(
    () => isFullyChargedRef.current,
    [],
  );

  const isPartlyCharged = useCallback(
    () => chargeProgress.get() > 0 && !isFullyChargedRef.current,
    [chargeProgress],
  );

  useEffect(() => () => chargeAnimation.current?.stop(), []);

  return {
    chargeProgress,
    startCharging,
    stopCharging,
    isFullyCharged,
    isPartlyCharged,
  };
}
