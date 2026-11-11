import type {
  DemographicQuestion,
  Statement,
  VoteType,
} from "../../src/types/index.ts";
import { OPT_OUT_ANSWER } from "../../src/utils/demographic-questions.ts";

export type RandomNumberSource = () => number;

export type SimulatedVote = Extract<VoteType, "agree" | "disagree" | "pass">;

export const AGREE_SHARE = 0.45;
export const DISAGREE_SHARE = 0.35;
export const STATEMENT_WRITER_SHARE = 0.15;
export const MID_DECK_WRITER_SHARE = 0.5;
export const MID_DECK_RESPONSE_VOTE_REQ = 2;
export const PHONE_LOCKER_SHARE = 0.1;
export const OPT_OUT_SHARE = 0.1;
export const SKIP_SHARE = 0.1;
export const MAXIMUM_PICK_ANY_OPTIONS = 2;

const MINIMUM_CARD_THINKING_MS = 1500;
const EXTRA_CARD_THINKING_MS = 7500;
const MINIMUM_STATEMENT_WRITING_MS = 8000;
const EXTRA_STATEMENT_WRITING_MS = 17_000;
const MINIMUM_PHONE_LOCK_DELAY_MS = 5000;
const EXTRA_PHONE_LOCK_DELAY_MS = 25_000;
const MINIMUM_PHONE_LOCKED_MS = 30_000;
const EXTRA_PHONE_LOCKED_MS = 60_000;
const MINIMUM_QUESTION_ANSWERING_MS = 2000;
const EXTRA_QUESTION_ANSWERING_MS = 6000;

export interface PhoneLock {
  startsAfterMs: number;
  lastsMs: number;
}

export type StatementTiming = "mid_deck" | "after_deck";

export interface AttendeePostPlan {
  statementTiming: StatementTiming | null;
  phoneLock: PhoneLock | null;
}

export function pickVote(random: RandomNumberSource): SimulatedVote {
  const roll = random();
  if (roll < AGREE_SHARE) return "agree";
  if (roll < AGREE_SHARE + DISAGREE_SHARE) return "disagree";
  return "pass";
}

export function pickJoinDelayMs(random: RandomNumberSource, joinWindowMs: number): number {
  return Math.round(random() * joinWindowMs);
}

export function pickCardThinkingMs(random: RandomNumberSource): number {
  return Math.round(MINIMUM_CARD_THINKING_MS + EXTRA_CARD_THINKING_MS * random() ** 2);
}

export function pickStatementWritingMs(random: RandomNumberSource): number {
  return Math.round(MINIMUM_STATEMENT_WRITING_MS + EXTRA_STATEMENT_WRITING_MS * random());
}

function pickStatementTiming(
  random: RandomNumberSource,
): StatementTiming | null {
  if (random() >= STATEMENT_WRITER_SHARE) return null;
  return random() < MID_DECK_WRITER_SHARE ? "mid_deck" : "after_deck";
}

export function planAttendeePost(random: RandomNumberSource): AttendeePostPlan {
  const statementTiming = pickStatementTiming(random);
  const willLockPhone = random() < PHONE_LOCKER_SHARE;
  return {
    statementTiming,
    phoneLock: willLockPhone
      ? {
        startsAfterMs: Math.round(MINIMUM_PHONE_LOCK_DELAY_MS + EXTRA_PHONE_LOCK_DELAY_MS * random()),
        lastsMs: Math.round(MINIMUM_PHONE_LOCKED_MS + EXTRA_PHONE_LOCKED_MS * random()),
      }
      : null,
  };
}

export function pickFromList<T>(random: RandomNumberSource, items: readonly T[]): T {
  return items[Math.min(Math.floor(random() * items.length), items.length - 1)];
}

export function findCardsLeftToVote(
  statements: Statement[],
  userId: string,
  votedStatementIds: ReadonlySet<string>,
): Statement[] {
  return statements.filter(
    (statement) =>
      !statement.isHidden &&
      statement.author !== userId &&
      !statement.voters?.[userId] &&
      !votedStatementIds.has(statement.id),
  );
}

export function pickQuestionAnsweringMs(
  random: RandomNumberSource,
): number {
  return Math.round(
    MINIMUM_QUESTION_ANSWERING_MS +
      EXTRA_QUESTION_ANSWERING_MS * random(),
  );
}

function pickDistinctOptions(
  random: RandomNumberSource,
  options: string[],
  pickCount: number,
): string[] {
  const optionsLeft = [...options];
  const pickedOptions: string[] = [];
  while (pickedOptions.length < pickCount && optionsLeft.length > 0) {
    const pickedOption = pickFromList(random, optionsLeft);
    pickedOptions.push(pickedOption);
    optionsLeft.splice(optionsLeft.indexOf(pickedOption), 1);
  }
  return pickedOptions;
}

function pickAnyAnswers(
  random: RandomNumberSource,
  options: string[],
): string[] {
  const roll = random();
  if (roll < SKIP_SHARE) return [];
  if (roll < SKIP_SHARE + OPT_OUT_SHARE) return [OPT_OUT_ANSWER];
  const pickCount =
    1 + Math.floor(random() * MAXIMUM_PICK_ANY_OPTIONS);
  return pickDistinctOptions(random, options, pickCount);
}

function pickSingleChoiceAnswer(
  random: RandomNumberSource,
  options: string[],
): string[] {
  if (random() < OPT_OUT_SHARE) return [OPT_OUT_ANSWER];
  return [pickFromList(random, options)];
}

export function pickOnboardingAnswers(
  random: RandomNumberSource,
  question: DemographicQuestion,
): string[] {
  const options = question.options ?? [];
  return question.multiSelect
    ? pickAnyAnswers(random, options)
    : pickSingleChoiceAnswer(random, options);
}
