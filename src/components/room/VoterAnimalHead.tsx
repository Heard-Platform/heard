import type { CSSProperties } from "react";
import { AVATAR_OPTIONS } from "../../utils/constants/avatars";
import { hashString } from "../../utils/hash";

const VOTER_ANIMAL_WIDTH = 40;
const AVATAR_ASPECT_RATIO = 685 / 497;
const AVATAR_HEIGHT = VOTER_ANIMAL_WIDTH * AVATAR_ASPECT_RATIO;
const HEAD_CROP_RATIO = 0.38;
export const VOTER_ANIMAL_HEAD_HEIGHT = AVATAR_HEIGHT * HEAD_CROP_RATIO;

const AVATAR_LIGHTEN_FILTER = "brightness(1.35) saturate(0.6)";

const headWindowStyle: CSSProperties = {
  position: "relative",
  display: "block",
  width: VOTER_ANIMAL_WIDTH,
  height: VOTER_ANIMAL_HEAD_HEIGHT,
  overflow: "hidden",
};

const avatarImgStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: VOTER_ANIMAL_WIDTH,
  height: AVATAR_HEIGHT,
  display: "block",
  userSelect: "none",
  pointerEvents: "none",
};

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function voterAnimalSeed(statementId: string, voterId: string): number {
  return hashString(`${statementId}:${voterId}`);
}

export function voterAvatarImage(seed: number): string {
  const avatarIndex = Math.floor(seededRandom(seed) * AVATAR_OPTIONS.length);
  return AVATAR_OPTIONS[avatarIndex].img;
}

interface VoterAnimalHeadProps {
  avatarImage: string;
  isHighlighted: boolean;
}

export function VoterAnimalHead({ avatarImage, isHighlighted }: VoterAnimalHeadProps) {
  return (
    <span style={headWindowStyle}>
      <img
        src={avatarImage}
        alt=""
        style={{
          ...avatarImgStyle,
          filter: isHighlighted ? undefined : AVATAR_LIGHTEN_FILTER,
        }}
      />
    </span>
  );
}
