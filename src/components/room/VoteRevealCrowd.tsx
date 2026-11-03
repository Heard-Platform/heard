import { useMemo, type CSSProperties } from "react";
import { motion, type Easing } from "motion/react";
import type { SimpleVoteType } from "../../types";
import {
  VOTE_REVEAL_SIDES,
  countVoterVotes,
  sampleVotesForCrowd,
  type VoterVote,
} from "../../utils/vote-reveal";
import {
  VOTER_ANIMAL_HEAD_HEIGHT,
  VoterAnimalHead,
  seededRandom,
  voterAnimalSeed,
  voterAvatarImage,
} from "./VoterAnimalHead";

const MAX_VISIBLE_ANIMALS = 20;
const ANIMAL_HALF_WIDTH_PERCENT = 6;
const THIRD_WIDTH_PERCENT = 100 / 3;
const GROUP_MAX_SPAN_PERCENT = THIRD_WIDTH_PERCENT - 2 * ANIMAL_HALF_WIDTH_PERCENT;
const GROUP_SPACING_PERCENT = 4;
const GROUP_JITTER_PERCENT = 1.5;
const HUDDLE_CENTER_PERCENT = 50;
const HUDDLE_SPREAD_PERCENT = 8;
const MINIMUM_SCURRY_DISTANCE_PERCENT = 1;

const POP_JITTER_SECONDS = 0.06;
const SCURRY_START_SECONDS = 0.3;
const SCURRY_START_JITTER_SECONDS = 0.08;
const SCURRY_MINIMUM_SECONDS = 0.28;
const SCURRY_SECONDS_ACROSS_FULL_WIDTH = 0.4;
const SCURRY_EASE: Easing = [0.5, 0, 0.15, 1];
const HOP_SECONDS = 0.1;
const HOP_HEIGHT_PX = 5;
const SETTLE_SECONDS = 0.4;
const SETTLE_STEP_PX = 3;
const SETTLE_KEYFRAME_TIMES = [0, 0.1, 0.45, 0.55, 1];

export const VOTE_REVEAL_CROWD_DURATION_MS =
  (SCURRY_START_SECONDS + SCURRY_START_JITTER_SECONDS + SCURRY_MINIMUM_SECONDS + SCURRY_SECONDS_ACROSS_FULL_WIDTH + SETTLE_SECONDS) * 1000;

const crowdStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: VOTER_ANIMAL_HEAD_HEIGHT,
  clipPath: "inset(-24px -24px 0 -24px)",
  pointerEvents: "none",
};

const currentVoterTagStyle: CSSProperties = {
  position: "absolute",
  bottom: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  marginBottom: 1,
  padding: "0 5px",
  borderRadius: 999,
  background: "#18181b",
  color: "#ffffff",
  fontSize: 9,
  fontWeight: 700,
  lineHeight: "14px",
  whiteSpace: "nowrap",
};

type FacingDirection = 1 | -1;

interface ScurryingAnimal {
  voterId: string;
  avatarImage: string;
  isCurrentVoter: boolean;
  startCenterPercent: number;
  targetCenterPercent: number;
  facingDirection: FacingDirection;
  popDelaySeconds: number;
  scurryDelaySeconds: number;
  scurryDurationSeconds: number;
}

function huddleCenterPercent(seed: number): number {
  return HUDDLE_CENTER_PERCENT + (seededRandom(seed) - 0.5) * HUDDLE_SPREAD_PERCENT;
}

function groupMemberCenterPercent(vote: SimpleVoteType, memberIndex: number, memberCount: number, seed: number): number {
  const thirdCenterPercent = (VOTE_REVEAL_SIDES.indexOf(vote) + 0.5) * THIRD_WIDTH_PERCENT;
  const groupSpanPercent = Math.min(GROUP_MAX_SPAN_PERCENT, (memberCount - 1) * GROUP_SPACING_PERCENT);
  const progressAcrossGroup = memberCount === 1 ? 0.5 : memberIndex / (memberCount - 1);
  const jitterPercent = (seededRandom(seed) - 0.5) * GROUP_JITTER_PERCENT;
  return thirdCenterPercent - groupSpanPercent / 2 + groupSpanPercent * progressAcrossGroup + jitterPercent;
}

function groupMemberIndexes(statementId: string, voterVotes: VoterVote[]): Map<string, number> {
  const memberIndexes = new Map<string, number>();
  for (const side of VOTE_REVEAL_SIDES) {
    voterVotes
      .filter(({ vote }) => vote === side)
      .map(({ voterId }) => voterId)
      .sort((a, b) => seededRandom(voterAnimalSeed(statementId, a) + 6) - seededRandom(voterAnimalSeed(statementId, b) + 6))
      .forEach((voterId, memberIndex) => memberIndexes.set(voterId, memberIndex));
  }
  return memberIndexes;
}

function facingDirectionOfTravel(startCenterPercent: number, targetCenterPercent: number, seed: number): FacingDirection {
  const travelPercent = targetCenterPercent - startCenterPercent;
  if (Math.abs(travelPercent) >= MINIMUM_SCURRY_DISTANCE_PERCENT) return travelPercent > 0 ? 1 : -1;
  return seededRandom(seed) < 0.5 ? 1 : -1;
}

function scurryDurationSeconds(startCenterPercent: number, targetCenterPercent: number): number {
  const travelShareOfWidth = Math.abs(targetCenterPercent - startCenterPercent) / 100;
  return SCURRY_MINIMUM_SECONDS + travelShareOfWidth * SCURRY_SECONDS_ACROSS_FULL_WIDTH;
}

function scurryingAnimals(statementId: string, voterVotes: VoterVote[], currentVoterId: string): ScurryingAnimal[] {
  const memberIndexes = groupMemberIndexes(statementId, voterVotes);
  const voteCounts = countVoterVotes(voterVotes);
  return voterVotes.map(({ voterId, vote }) => {
    const seed = voterAnimalSeed(statementId, voterId);
    const startCenterPercent = huddleCenterPercent(seed + 1);
    const targetCenterPercent = groupMemberCenterPercent(vote, memberIndexes.get(voterId) ?? 0, voteCounts[vote], seed + 2);
    return {
      voterId,
      avatarImage: voterAvatarImage(seed),
      isCurrentVoter: voterId === currentVoterId,
      startCenterPercent,
      targetCenterPercent,
      facingDirection: facingDirectionOfTravel(startCenterPercent, targetCenterPercent, seed + 3),
      popDelaySeconds: seededRandom(seed + 4) * POP_JITTER_SECONDS,
      scurryDelaySeconds: SCURRY_START_SECONDS + seededRandom(seed + 5) * SCURRY_START_JITTER_SECONDS,
      scurryDurationSeconds: scurryDurationSeconds(startCenterPercent, targetCenterPercent),
    };
  });
}

function leftEdgePercent(centerPercent: number): string {
  return `${centerPercent - ANIMAL_HALF_WIDTH_PERCENT}%`;
}

function currentVoterLast(animals: ScurryingAnimal[]): ScurryingAnimal[] {
  return [...animals.filter((animal) => !animal.isCurrentVoter), ...animals.filter((animal) => animal.isCurrentVoter)];
}

function hopKeyframes(durationSeconds: number): { heights: number[]; eases: Easing[] } {
  const hopCount = Math.max(1, Math.round(durationSeconds / HOP_SECONDS));
  const heights = [0];
  const eases: Easing[] = [];
  for (let hop = 0; hop < hopCount; hop++) {
    heights.push(-HOP_HEIGHT_PX, 0);
    eases.push("easeOut", "easeIn");
  }
  return { heights, eases };
}

interface VoteRevealCrowdProps {
  statementId: string;
  voterVotes: VoterVote[];
  currentVoterId: string;
}

export function VoteRevealCrowd({ statementId, voterVotes, currentVoterId }: VoteRevealCrowdProps) {
  const visibleVoterVotes = sampleVotesForCrowd(voterVotes, MAX_VISIBLE_ANIMALS, currentVoterId);
  const animals = useMemo(
    () => currentVoterLast(scurryingAnimals(statementId, visibleVoterVotes, currentVoterId)),
    [statementId, currentVoterId, visibleVoterVotes.map(({ voterId, vote }) => `${voterId}:${vote}`).join(",")],
  );

  return (
    <div style={crowdStyle}>
      {animals.map((animal) => (
        <ScurryingVoterAnimal key={animal.voterId} animal={animal} />
      ))}
    </div>
  );
}

function ScurryingVoterAnimal({ animal }: { animal: ScurryingAnimal }) {
  const { facingDirection, scurryDelaySeconds, scurryDurationSeconds } = animal;
  const hops = hopKeyframes(scurryDurationSeconds);
  const settleStepPx = -facingDirection * SETTLE_STEP_PX;

  return (
    <motion.span
      style={{ position: "absolute", bottom: 0 }}
      initial={{ left: leftEdgePercent(animal.startCenterPercent) }}
      animate={{ left: leftEdgePercent(animal.targetCenterPercent) }}
      transition={{ delay: scurryDelaySeconds, duration: scurryDurationSeconds, ease: SCURRY_EASE }}
    >
      <motion.span
        style={{ display: "block" }}
        initial={{ y: VOTER_ANIMAL_HEAD_HEIGHT }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 20, delay: animal.popDelaySeconds }}
      >
        <motion.span
          style={{ position: "relative", display: "block" }}
          animate={{ y: hops.heights }}
          transition={{ delay: scurryDelaySeconds, duration: scurryDurationSeconds, ease: hops.eases }}
        >
          {animal.isCurrentVoter && <span style={currentVoterTagStyle}>you</span>}
          <motion.span
            style={{ display: "block" }}
            initial={{ x: 0, scaleX: facingDirection }}
            animate={{
              x: [0, 0, settleStepPx, settleStepPx, 0],
              scaleX: [facingDirection, -facingDirection, -facingDirection, facingDirection, facingDirection],
            }}
            transition={{
              delay: scurryDelaySeconds + scurryDurationSeconds,
              duration: SETTLE_SECONDS,
              times: SETTLE_KEYFRAME_TIMES,
            }}
          >
            <VoterAnimalHead avatarImage={animal.avatarImage} isHighlighted={animal.isCurrentVoter} />
          </motion.span>
        </motion.span>
      </motion.span>
    </motion.span>
  );
}
