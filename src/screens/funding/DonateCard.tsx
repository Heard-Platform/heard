import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import type { PanInfo } from "motion/react";
import { useTranslation } from "react-i18next";
import { C, fmt } from "./constants";

interface DonateCardProps {
  amount: number;
  nugMode: boolean;
  onSwipeRight: () => void;
  onTapAmount: () => void;
}

export function DonateCard({ amount, nugMode, onSwipeRight, onTapAmount }: DonateCardProps) {
  const { t } = useTranslation("funding");
  const [swiped, setSwiped] = useState(false);
  const x = useMotionValue(0);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, []);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const badgeOpacity = useTransform(x, [20, 80], [0, 1]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100 || info.velocity.x > 500) {
      setSwiped(true);
      setTimeout(() => onSwipeRight(), 300);
    }
  };

  return (
    <motion.div
      ref={dragRef}
      style={{
        x: swiped ? undefined : x,
        rotate: swiped ? undefined : rotate,
        opacity: swiped ? undefined : cardOpacity,
        zIndex: 10,
        touchAction: "none",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
      }}
      animate={swiped ? { x: 500, rotate: 45, opacity: 0 } : undefined}
      transition={swiped ? { duration: 0.3 } : undefined}
      drag={swiped ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        padding: 32,
        borderRadius: 12,
        border: `2px solid ${C.emerald300}`,
        background: `linear-gradient(to bottom right, ${C.emerald100}, ${C.emerald50}, ${C.teal100})`,
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        cursor: "grab",
        userSelect: "none",
        position: "relative",
        minHeight: 380,
      }}>
        <motion.div style={{
          opacity: badgeOpacity,
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: C.emerald500,
          color: "white",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.05em",
          padding: "6px 12px",
          borderRadius: 999,
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          whiteSpace: "nowrap",
        }}>
          {t("fundDonateBadge")}
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 316 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.slate800, lineHeight: 1.375, marginBottom: 16 }}>
            {t("fundIWantToDonate")}
          </p>

          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onTapAmount(); }}
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: C.emerald600,
              paddingBottom: 4,
              marginBottom: 16,
              lineHeight: 1,
              background: "none",
              border: "none",
              borderBottom: `3px dashed ${C.emerald500}`,
              cursor: "pointer",
            }}
          >
            {fmt(amount, nugMode)}
          </button>
          <p style={{ fontSize: 12, color: C.emerald600, marginBottom: 16, marginTop: -10, fontWeight: 500 }}>
            {t("fundTapToChange")}
          </p>

          <p style={{ fontSize: 22, fontWeight: 700, color: C.slate800, lineHeight: 1.375, marginBottom: 40 }}>
            {t("fundToHeard")}
          </p>

          <motion.p
            style={{ color: C.slate700, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            {t("fundSwipeRight")}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
