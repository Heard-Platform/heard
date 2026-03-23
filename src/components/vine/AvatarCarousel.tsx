import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { AVATAR_OPTIONS, getAvatarImage } from "../../utils/constants/avatars";
import { useCallback, useEffect, useState } from "react";
import { useDebateSession } from "../../hooks/useDebateSession";

const VISIBLE_SLOTS = [-2, -1, 0, 1, 2] as const;

const ARROW_OFFSET = 36;

const SLOT_STYLES: Record<number, { x: number; scale: number; opacity: number; zIndex: number }> = {
  [-2]: { x: -150, scale: 0.45, opacity: 0.25, zIndex: 1 },
  [-1]: { x: -90, scale: 0.65, opacity: 0.5, zIndex: 2 },
  [0]: { x: 0, scale: 1, opacity: 1, zIndex: 3 },
  [1]: { x: 90, scale: 0.65, opacity: 0.5, zIndex: 2 },
  [2]: { x: 150, scale: 0.45, opacity: 0.25, zIndex: 1 },
};

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 30 };

const ARROW_BG = "rgba(255,255,255,0.55)";
const ARROW_BG_HOVER = "rgba(255,255,255,0.7)";

export function AvatarCarousel({
  currentAvatar,
  isLoggedIn,
}: {
  currentAvatar: string;
  isLoggedIn: boolean;
}) {
  const { updateAvatar } = useDebateSession();

  const [selectedIndex, setSelectedIndex] = useState(() =>
    Math.max(
      0,
      AVATAR_OPTIONS.findIndex((o) => o.value === currentAvatar),
    ),
  );

  const selectedAvatar = AVATAR_OPTIONS[selectedIndex].value;

  useEffect(() => {
    const idx = AVATAR_OPTIONS.findIndex((o) => o.value === currentAvatar);
    if (idx >= 0) setSelectedIndex(idx);
  }, [currentAvatar]);

  const wrapIndex = useCallback(
    (i: number) =>
      ((i % AVATAR_OPTIONS.length) + AVATAR_OPTIONS.length) %
      AVATAR_OPTIONS.length,
    [],
  );

  const handlePrev = useCallback(() => {
    const newIndex = wrapIndex(selectedIndex - 1);
    setSelectedIndex(newIndex);
    updateAvatar(AVATAR_OPTIONS[newIndex].value);
  }, [selectedIndex, wrapIndex, updateAvatar]);

  const handleNext = useCallback(() => {
    const newIndex = wrapIndex(selectedIndex + 1);
    setSelectedIndex(newIndex);
    updateAvatar(AVATAR_OPTIONS[newIndex].value);
  }, [selectedIndex, wrapIndex, updateAvatar]);

  return isLoggedIn ? (
    <div className="relative flex items-center justify-center h-32">
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {VISIBLE_SLOTS.map((offset) => {
          const idx = wrapIndex(selectedIndex + offset);
          const option = AVATAR_OPTIONS[idx];
          const style = SLOT_STYLES[offset];
          return (
            <motion.div
              key={`slot-${offset}`}
              className="absolute flex flex-col items-center"
              animate={{
                x: style.x,
                scale: style.scale,
                opacity: style.opacity,
                zIndex: style.zIndex,
              }}
              transition={SPRING_CONFIG}
            >
              <img
                src={option.img}
                alt={option.label}
                className="w-20 h-24 object-contain drop-shadow-2xl"
                style={{ transform: "scaleX(-1)" }}
              />
              {offset === 0 && (
                <span className="text-xs text-white font-medium mt-1 drop-shadow">
                  {option.label}
                </span>
              )}
            </motion.div>
          );
        })}
        <button
          onClick={handlePrev}
          className="absolute z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            right: `calc(50% + ${ARROW_OFFSET}px)`,
            backgroundColor: ARROW_BG,
          }}
          onPointerEnter={(e) => {
            e.currentTarget.style.backgroundColor = ARROW_BG_HOVER;
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.backgroundColor = ARROW_BG;
          }}
        >
          <ChevronLeft className="w-4 h-4 text-emerald-700" />
        </button>
        <button
          onClick={handleNext}
          className="absolute z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            left: `calc(50% + ${ARROW_OFFSET}px)`,
            backgroundColor: ARROW_BG,
          }}
          onPointerEnter={(e) => {
            e.currentTarget.style.backgroundColor = ARROW_BG_HOVER;
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.backgroundColor = ARROW_BG;
          }}
        >
          <ChevronRight className="w-4 h-4 text-emerald-700" />
        </button>
      </div>
    </div>
  ) : (
    <div className="flex justify-center">
      <motion.img
        src={getAvatarImage(selectedAvatar)}
        alt="Your Animal Friend"
        className="w-24 h-28 object-contain drop-shadow-2xl"
        style={{ scaleX: -1 }}
        animate={{ rotate: [-5, 5, -5] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}