import { useEffect, useRef, useState } from "react";
import {
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
  type PanInfo,
} from "motion/react";

const HOLD_ZONE = 70;
const CHARGE_MS = 3000;
const CHARGE_DRAIN_MULTIPLIER = 1.7;
const REVEAL_DELAY_MS = 250;

interface UseSuperChargeOptions {
  x: MotionValue<number>;
  isTopCard: boolean;
  isChargeable: boolean;
  onSuperAgree: () => void;
  onSuperDisagree: () => void;
  onDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => void;
}

export function useSuperCharge({
  x,
  isTopCard,
  isChargeable,
  onSuperAgree,
  onSuperDisagree,
  onDragEnd,
}: UseSuperChargeOptions) {
  const charge = useMotionValue(0);

  const [armed, setArmed] = useState(false);
  useMotionValueEvent(charge, "change", (v) => setArmed(v >= 1));

  const [chargeVisible, setChargeVisible] = useState(false);
  const [chargeSide, setChargeSide] = useState<
    "agree" | "disagree" | null
  >(null);

  const isDraggingRef = useRef(false);
  const lastTickRef = useRef(0);
  const chargeRafRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const chargeVisibleRef = useRef(false);
  const chargeSideRef = useRef<"agree" | "disagree" | null>(null);

  const showCharge = (side: "agree" | "disagree") => {
    chargeVisibleRef.current = true;
    setChargeVisible(true);
    setChargeSide(side);
  };

  const hideCharge = () => {
    chargeVisibleRef.current = false;
    setChargeVisible(false);
    setChargeSide(null);
  };

  const tickCharge = (now: number) => {
    if (!isDraggingRef.current) return;
    const dt = lastTickRef.current ? now - lastTickRef.current : 0;
    lastTickRef.current = now;

    const dx = x.get();
    const sign: "agree" | "disagree" | null =
      dx > 0 ? "agree" : dx < 0 ? "disagree" : null;

    // The drag has moved to the opposite side of whatever charge is
    // accumulated (or was accumulating) — that charge no longer applies.
    if (
      chargeSideRef.current !== null &&
      sign !== null &&
      sign !== chargeSideRef.current
    ) {
      charge.set(0);
      chargeSideRef.current = null;
      holdStartRef.current = null;
      hideCharge();
    }

    const holding = Math.abs(dx) >= HOLD_ZONE;
    if (holding) {
      chargeSideRef.current = sign;
    }

    const current = charge.get();
    const next = holding
      ? Math.min(1, current + dt / CHARGE_MS)
      : Math.max(
          0,
          current - (dt / CHARGE_MS) * CHARGE_DRAIN_MULTIPLIER,
        );
    charge.set(next);

    if (holding) {
      if (holdStartRef.current === null) holdStartRef.current = now;
      if (
        !chargeVisibleRef.current &&
        now - holdStartRef.current >= REVEAL_DELAY_MS
      ) {
        showCharge(sign!);
      }
    } else {
      holdStartRef.current = null;
      if (next <= 0) {
        chargeSideRef.current = null;
        if (chargeVisibleRef.current) hideCharge();
      }
    }

    chargeRafRef.current = requestAnimationFrame(tickCharge);
  };

  const stopCharging = () => {
    isDraggingRef.current = false;
    holdStartRef.current = null;
    chargeSideRef.current = null;
    hideCharge();
    if (chargeRafRef.current !== null) {
      cancelAnimationFrame(chargeRafRef.current);
      chargeRafRef.current = null;
    }
  };

  const handleDragStart = () => {
    if (!isChargeable) return;
    isDraggingRef.current = true;
    lastTickRef.current = 0;
    chargeRafRef.current = requestAnimationFrame(tickCharge);
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const wasArmed = isChargeable && charge.get() >= 1;
    const wasAgree = x.get() > 0;
    stopCharging();
    charge.set(0);

    if (wasArmed) {
      if (wasAgree) {
        onSuperAgree();
      } else {
        onSuperDisagree();
      }
      return;
    }

    onDragEnd(event, info);
  };

  useEffect(() => {
    if (isTopCard) {
      charge.set(0);
    }
    return stopCharging;
  }, [isTopCard, charge]);

  return {
    charge,
    chargeVisible,
    chargeSide,
    armed,
    handleDragStart,
    handleDragEnd,
  };
}
