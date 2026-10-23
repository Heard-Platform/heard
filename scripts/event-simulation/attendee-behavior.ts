import type { Statement, VoteType } from "../../src/types/index.ts";

export type RandomNumberSource = () => number;

export type SimulatedVote = Extract<VoteType, "agree" | "disagree" | "pass">;

export const AGREE_SHARE = 0.45;
export const DISAGREE_SHARE = 0.35;
export const STATEMENT_WRITER_SHARE = 0.15;
export const PHONE_LOCKER_SHARE = 0.1;

const MINIMUM_CARD_THINKING_MS = 1500;
const EXTRA_CARD_THINKING_MS = 7500;
const MINIMUM_STATEMENT_WRITING_MS = 8000;
const EXTRA_STATEMENT_WRITING_MS = 17_000;
const MINIMUM_PHONE_LOCK_DELAY_MS = 5000;
const EXTRA_PHONE_LOCK_DELAY_MS = 25_000;
const MINIMUM_PHONE_LOCKED_MS = 30_000;
const EXTRA_PHONE_LOCKED_MS = 60_000;

export interface PhoneLock {
  startsAfterMs: number;
  lastsMs: number;
}

export interface AttendeePostPlan {
  willWriteStatement: boolean;
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

export function planAttendeePost(random: RandomNumberSource): AttendeePostPlan {
  const willWriteStatement = random() < STATEMENT_WRITER_SHARE;
  const willLockPhone = random() < PHONE_LOCKER_SHARE;
  return {
    willWriteStatement,
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
