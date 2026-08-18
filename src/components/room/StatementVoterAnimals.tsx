import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AVATAR_OPTIONS } from "../../utils/constants/avatars";

const MAX_VISIBLE_ANIMALS = 20;
const BUBBLE_MIN_DELAY_MS = 2500;
const BUBBLE_MAX_DELAY_MS = 6000;
const BUBBLE_VISIBLE_MS = 2200;

const AVATAR_WIDTH = 40;
const AVATAR_ASPECT_RATIO = 685 / 497;
const AVATAR_HEIGHT = AVATAR_WIDTH * AVATAR_ASPECT_RATIO;
const HEAD_CROP_RATIO = 0.38;
const HEAD_WINDOW_HEIGHT = AVATAR_HEIGHT * HEAD_CROP_RATIO;

const rowStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: HEAD_WINDOW_HEIGHT,
};

const animalStyle: CSSProperties = {
  position: "absolute",
};

const headWindowStyle: CSSProperties = {
  position: "relative",
  display: "block",
  width: AVATAR_WIDTH,
  height: HEAD_WINDOW_HEIGHT,
  overflow: "hidden",
};

const AVATAR_LIGHTEN_FILTER = "brightness(1.35) saturate(0.6)";

const avatarImgStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: AVATAR_WIDTH,
  height: AVATAR_HEIGHT,
  display: "block",
  userSelect: "none",
  pointerEvents: "none",
  filter: AVATAR_LIGHTEN_FILTER,
};

const bubbleStyle: CSSProperties = {
  position: "absolute",
  bottom: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  marginBottom: 4,
  display: "flex",
  alignItems: "center",
  gap: 3,
  background: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: 10,
  padding: "5px 8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  zIndex: 3,
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

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface VoterAnimal {
  key: string;
  avatarImg: string;
  right: number;
  flipped: boolean;
}

interface StatementVoterAnimalsProps {
  statementId: string;
  voterIds: string[];
}

export function StatementVoterAnimals({
  statementId,
  voterIds,
}: StatementVoterAnimalsProps) {
  const visibleVoterIds = voterIds.slice(0, MAX_VISIBLE_ANIMALS);
  const voterIdsKey = visibleVoterIds.join(",");

  const animals = useMemo<VoterAnimal[]>(
    () =>
      visibleVoterIds.map((voterId) => {
        const seed = hashString(`${statementId}:${voterId}`);
        const avatarIndex = Math.floor(
          seededRandom(seed) * AVATAR_OPTIONS.length,
        );
        return {
          key: voterId,
          avatarImg: AVATAR_OPTIONS[avatarIndex].img,
          right: 2 + seededRandom(seed + 1) * 18,
          flipped: seededRandom(seed + 3) < 0.5,
        };
      }),
    [statementId, voterIdsKey],
  );

  const [bubbleKey, setBubbleKey] = useState<string | null>(null);

  useEffect(() => {
    if (animals.length === 0) {
      setBubbleKey(null);
      return;
    }

    let hideTimeout: ReturnType<typeof setTimeout>;
    let scheduleTimeout: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay =
        BUBBLE_MIN_DELAY_MS +
        Math.random() * (BUBBLE_MAX_DELAY_MS - BUBBLE_MIN_DELAY_MS);
      scheduleTimeout = setTimeout(showBubble, delay);
    };

    const showBubble = () => {
      const animal = animals[Math.floor(Math.random() * animals.length)];
      setBubbleKey(animal.key);

      hideTimeout = setTimeout(() => {
        setBubbleKey(null);
        scheduleNext();
      }, BUBBLE_VISIBLE_MS);
    };

    scheduleNext();

    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(scheduleTimeout);
    };
  }, [animals]);

  if (animals.length === 0) return null;

  return (
    <div style={rowStyle}>
      {animals.map((animal) => (
        <span
          key={animal.key}
          style={{
            ...animalStyle,
            right: `${animal.right}%`,
            bottom: 0,
          }}
        >
          {bubbleKey === animal.key && (
            <span style={bubbleStyle}>
              <span style={bubbleDotStyle} />
              <span style={bubbleDotStyle} />
              <span style={bubbleDotStyle} />
              <span style={bubbleTailStyle} />
            </span>
          )}
          <span style={headWindowStyle}>
            <img
              src={animal.avatarImg}
              alt=""
              style={{
                ...avatarImgStyle,
                transform: animal.flipped ? "scaleX(-1)" : undefined,
              }}
            />
          </span>
        </span>
      ))}
    </div>
  );
}
