import type {
  AttendeePhoneState,
  SupportViewAttendeeStatement,
  SupportViewCurrentPost,
  SupportViewStats,
} from "../types";

const SECOND_MS = 1000;
const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * MINUTE_SECONDS;

export const ATTENDEE_PHONE_STATES: readonly AttendeePhoneState[] = ["swiping", "waiting", "lobby", "end", "idle"];

export function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / SECOND_MS));
  const hours = Math.floor(totalSeconds / HOUR_SECONDS);
  const minutes = Math.floor((totalSeconds % HOUR_SECONDS) / MINUTE_SECONDS);
  const seconds = totalSeconds % MINUTE_SECONDS;
  if (hours > 0) return `${hours}h ${padToTwoDigits(minutes)}m`;
  if (minutes > 0) return `${minutes}m ${padToTwoDigits(seconds)}s`;
  return `${seconds}s`;
}

const padToTwoDigits = (value: number): string => String(value).padStart(2, "0");

export function getVotesPerPerson(votes: number, peopleHere: number): number {
  if (peopleHere === 0) return 0;
  return Math.round((votes / peopleHere) * 10) / 10;
}

export function listPhoneStates(phoneCountsByState: Record<AttendeePhoneState, number>): AttendeePhoneState[] {
  return ATTENDEE_PHONE_STATES.flatMap((state) => Array<AttendeePhoneState>(phoneCountsByState[state]).fill(state));
}

export interface VoteMixPercents {
  agree: number;
  disagree: number;
  pass: number;
}

export type VoteCounts = Pick<SupportViewCurrentPost, "agreeVotes" | "disagreeVotes" | "passVotes">;

export const getTotalVotes = (voteCounts: VoteCounts): number =>
  voteCounts.agreeVotes + voteCounts.disagreeVotes + voteCounts.passVotes;

export function getVoteMixPercents(voteCounts: VoteCounts): VoteMixPercents {
  const totalVotes = getTotalVotes(voteCounts);
  if (totalVotes === 0) return { agree: 0, disagree: 0, pass: 0 };
  const toPercent = (votes: number) => Math.round((votes / totalVotes) * 100);
  return {
    agree: toPercent(voteCounts.agreeVotes),
    disagree: toPercent(voteCounts.disagreeVotes),
    pass: toPercent(voteCounts.passVotes),
  };
}

export const orderNewestFirst = (attendeeStatements: SupportViewAttendeeStatement[]): SupportViewAttendeeStatement[] =>
  [...attendeeStatements].sort((first, second) => second.createdAt - first.createdAt);

export function getFinishedPercent(currentPost: Pick<SupportViewCurrentPost, "finishedCount" | "swipingCount">): number {
  const phonesOnPost = currentPost.finishedCount + currentPost.swipingCount;
  if (phonesOnPost === 0) return 0;
  return Math.round((currentPost.finishedCount / phonesOnPost) * 100);
}

export function describeSessionStatus(
  stats: Pick<SupportViewStats, "status" | "votingPaused" | "postCount" | "currentPost">,
): string {
  if (stats.status === "setup") return "Not started";
  if (stats.status === "ended") return "Ended";
  const postPosition = stats.currentPost ? ` · Post ${stats.currentPost.postNumber} of ${stats.postCount}` : "";
  return `${stats.votingPaused ? "Paused" : "Live"}${postPosition}`;
}
