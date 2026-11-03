import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { VoterAnimalHead, voterAvatarImage } from "./VoterAnimalHead";

const IDLE_BEFORE_FIRST_PEEK_MS = 6000;
const IDLE_BETWEEN_PEEKS_MS = 10000;
export const PEEK_VISIBLE_MS = 2200;
const MAX_PEEKS_PER_CARD = 3;
const BUTTON_COUNT = 3;
const PEEK_RISE_PX = 20;
const ANIMAL_HALF_WIDTH_PX = 20;
const BUBBLE_DELAY_SECONDS = 0.3;
const ACTIVITY_EVENT_TYPES = ["pointerdown", "keydown", "wheel", "scroll"] as const;

const peekLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

const peekingAnimalStyle: CSSProperties = {
  position: "absolute",
  top: 0,
};

const bubbleStyle: CSSProperties = {
  position: "absolute",
  bottom: "100%",
  left: "50%",
  marginBottom: 4,
  display: "flex",
  alignItems: "center",
  gap: 3,
  background: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: 10,
  padding: "5px 8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
};

const bubbleDotStyle: CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: "50%",
  background: "#a1a1aa",
};

const bubbleTailStyle: CSSProperties = {
  position: "absolute",
  top: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  width: 0,
  height: 0,
  borderLeft: "5px solid transparent",
  borderRight: "5px solid transparent",
  borderTop: "5px solid #ffffff",
};

export interface Peek {
  id: number;
  buttonIndex: number;
  avatarImage: string;
  isFacingLeft: boolean;
}

export const randomPeek = (id: number): Peek => ({
  id,
  buttonIndex: Math.floor(Math.random() * BUTTON_COUNT),
  avatarImage: voterAvatarImage(Math.floor(Math.random() * 1_000_000)),
  isFacingLeft: Math.random() < 0.5,
});

const peekLeft = (buttonIndex: number): string =>
  `calc(${((buttonIndex + 0.5) / BUTTON_COUNT) * 100}% - ${ANIMAL_HALF_WIDTH_PX}px)`;

function useIdlePeek(canPeek: boolean): Peek | null {
  const [peek, setPeek] = useState<Peek | null>(null);
  const peekCountRef = useRef(0);

  useEffect(() => {
    if (!canPeek) return;

    let idleTimeout: ReturnType<typeof setTimeout>;
    let hideTimeout: ReturnType<typeof setTimeout>;

    const scheduleNextPeek = (delayMs: number) => {
      clearTimeout(idleTimeout);
      if (peekCountRef.current >= MAX_PEEKS_PER_CARD) return;
      idleTimeout = setTimeout(showPeek, delayMs);
    };

    const showPeek = () => {
      peekCountRef.current++;
      setPeek(randomPeek(peekCountRef.current));
      hideTimeout = setTimeout(() => setPeek(null), PEEK_VISIBLE_MS);
      scheduleNextPeek(IDLE_BETWEEN_PEEKS_MS);
    };

    const restartIdleClock = () => scheduleNextPeek(IDLE_BEFORE_FIRST_PEEK_MS);

    restartIdleClock();
    ACTIVITY_EVENT_TYPES.forEach((type) =>
      window.addEventListener(type, restartIdleClock, { capture: true, passive: true }),
    );

    return () => {
      clearTimeout(idleTimeout);
      clearTimeout(hideTimeout);
      ACTIVITY_EVENT_TYPES.forEach((type) => window.removeEventListener(type, restartIdleClock, { capture: true }));
      setPeek(null);
    };
  }, [canPeek]);

  return peek;
}

export function IdleAnimalPeek({ children }: { children: ReactNode }) {
  const buttonRowRef = useRef<HTMLDivElement>(null);
  const isFullyInView = useInView(buttonRowRef, { amount: "all" });
  const prefersReducedMotion = useReducedMotion();
  const peek = useIdlePeek(isFullyInView && !prefersReducedMotion);

  return (
    <div ref={buttonRowRef}>
      <AnimalPeekLayer peek={peek}>{children}</AnimalPeekLayer>
    </div>
  );
}

interface AnimalPeekLayerProps {
  peek: Peek | null;
  children: ReactNode;
}

export function AnimalPeekLayer({ peek, children }: AnimalPeekLayerProps) {
  return (
    <div className="relative">
      <div style={peekLayerStyle}>
        <AnimatePresence>
          {peek && (
            <motion.span
              key={peek.id}
              style={{ ...peekingAnimalStyle, left: peekLeft(peek.buttonIndex) }}
              initial={{ y: 0 }}
              animate={{ y: -PEEK_RISE_PX }}
              exit={{ y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <motion.span
                style={bubbleStyle}
                initial={{ opacity: 0, scale: 0.6, x: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%" }}
                exit={{ opacity: 0, x: "-50%", transition: { delay: 0 } }}
                transition={{ delay: BUBBLE_DELAY_SECONDS }}
              >
                <span style={bubbleDotStyle} />
                <span style={bubbleDotStyle} />
                <span style={bubbleDotStyle} />
                <span style={bubbleTailStyle} />
              </motion.span>
              <span style={{ display: "block", transform: peek.isFacingLeft ? "scaleX(-1)" : undefined }}>
                <VoterAnimalHead avatarImage={peek.avatarImage} isHighlighted={false} />
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
