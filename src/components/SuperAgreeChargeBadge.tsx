import { motion, useTransform, type MotionValue } from "motion/react";
import { Star } from "lucide-react";

interface SuperAgreeChargeBadgeProps {
  chargeProgress: MotionValue<number>;
  className: string;
}

export function SuperAgreeChargeBadge({
  chargeProgress,
  className,
}: SuperAgreeChargeBadgeProps) {
  const opacity = useTransform(chargeProgress, [0, 0.05], [0, 1]);
  const scale = useTransform(
    chargeProgress,
    [0, 0.98, 1],
    [0.85, 1, 1.15],
  );
  const filledClipPath = useTransform(
    chargeProgress,
    (progress) => `inset(0 ${100 - progress * 100}% 0 0)`,
  );

  return (
    <motion.span
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{ opacity, scale }}
    >
      <span className="relative block overflow-hidden rounded-full">
        <SuperAgreeBadgeLabel className="normal-bg super-agree-text super-agree-border" />
        <motion.span
          className="absolute inset-0"
          style={{ clipPath: filledClipPath }}
        >
          <SuperAgreeBadgeLabel className="super-agree-chip" />
        </motion.span>
      </span>
    </motion.span>
  );
}

function SuperAgreeBadgeLabel({ className }: { className: string }) {
  return (
    <span
      className={`flex items-center gap-1 whitespace-nowrap rounded-full border-2 px-2.5 py-1 text-sm font-black tracking-widest ${className}`}
    >
      <Star className="h-4 w-4 fill-current" />
      SUPER AGREE
    </span>
  );
}
