import { motion } from "motion/react";
import { Star } from "lucide-react";

const STAR_SPACING_PX = 34;
const STAR_STAGGER_S = 0.035;
const STAR_LIFETIME_S = 0.45;
const STAR_DRIFT_PX = 18;

const TRAIL_STARS = [
  { offsetY: -28, sizePx: 14, spin: 40 },
  { offsetY: 16, sizePx: 10, spin: -30 },
  { offsetY: -10, sizePx: 16, spin: 25 },
  { offsetY: 32, sizePx: 11, spin: -45 },
  { offsetY: -38, sizePx: 12, spin: 35 },
  { offsetY: 6, sizePx: 15, spin: -20 },
  { offsetY: -20, sizePx: 10, spin: 50 },
  { offsetY: 26, sizePx: 13, spin: -35 },
];

interface SuperAgreeStarTrailProps {
  startX: number;
  onFinished: () => void;
}

export function SuperAgreeStarTrail({
  startX,
  onFinished,
}: SuperAgreeStarTrailProps) {
  const lastStarIndex = TRAIL_STARS.length - 1;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-10"
    >
      {TRAIL_STARS.map((star, starIndex) => (
        <motion.span
          key={starIndex}
          className="absolute super-agree-text"
          style={{
            left: startX + starIndex * STAR_SPACING_PX,
            top: star.offsetY,
            marginLeft: -star.sizePx / 2,
            marginTop: -star.sizePx / 2,
          }}
          initial={{ opacity: 0, scale: 0, rotate: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0.6],
            rotate: star.spin,
            y: STAR_DRIFT_PX,
          }}
          transition={{
            duration: STAR_LIFETIME_S,
            delay: starIndex * STAR_STAGGER_S,
            ease: "easeOut",
          }}
          onAnimationComplete={
            starIndex === lastStarIndex ? onFinished : undefined
          }
        >
          <Star
            className="super-agree-fill"
            style={{ width: star.sizePx, height: star.sizePx }}
          />
        </motion.span>
      ))}
    </div>
  );
}
