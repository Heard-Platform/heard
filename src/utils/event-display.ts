import _ from "lodash";
import type { LiveEventView, Statement } from "../types";
import { pluralizePerson } from "./text";

export type DisplayView = "agree-only" | "agree-vs-disagree" | "agree-split";

export const ATTENDEE_STATEMENT_MIN_VOTES_FOR_BOARD = 5;
export const ATTENDEE_STATEMENT_BOARD_SLOTS = 5;
export const BOARD_STATEMENT_LIMIT = 7;
export const CONSENSUS_COLUMN_SIZE = 4;
export const NEW_STATEMENT_CELEBRATE_MS = 15_000;
export const NEW_STATEMENT_INVITE_AFTER_MS = 45_000;

export interface VoteShares {
  agree: number;
  disagree: number;
  pass: number;
  total: number;
}

export function getVoteShares(statement: Statement): VoteShares {
  const agrees = statement.agrees;
  const total = agrees + statement.disagrees + statement.passes;
  if (total === 0) return { agree: 0, disagree: 0, pass: 0, total };
  return {
    agree: (agrees / total) * 100,
    disagree: (statement.disagrees / total) * 100,
    pass: (statement.passes / total) * 100,
    total,
  };
}

const getAgreeDisagreeGap = (statement: Statement): number => {
  const voteShares = getVoteShares(statement);
  return Math.abs(voteShares.agree - voteShares.disagree);
};

const getVoteCount = (statement: Statement): number => getVoteShares(statement).total;

export const isAttendeeStatement = (statement: Statement, startedAt: number | null): boolean =>
  startedAt !== null && statement.timestamp >= startedAt;

const getAgreeShare = (statement: Statement): number => getVoteShares(statement).agree;

const getTimestamp = (statement: Statement): number => statement.timestamp;

const rankByAgreeShare = (statements: Statement[]): Statement[] =>
  _.orderBy(statements, [getAgreeShare, getTimestamp], ["desc", "desc"]);

const rankBySplit = (statements: Statement[]): Statement[] =>
  _.orderBy(statements, [getAgreeDisagreeGap, getTimestamp], ["asc", "desc"]);

function pickAttendeeStatementsOnBoard(attendeeStatements: Statement[]): Statement[] {
  const qualifiedAttendeeStatements = attendeeStatements.filter(
    (statement) => getVoteCount(statement) >= ATTENDEE_STATEMENT_MIN_VOTES_FOR_BOARD,
  );
  const rankingsTakingTurns = [rankByAgreeShare(qualifiedAttendeeStatements), rankBySplit(qualifiedAttendeeStatements)];
  const slotCount = Math.min(ATTENDEE_STATEMENT_BOARD_SLOTS, qualifiedAttendeeStatements.length);

  return _.range(slotCount).reduce<Statement[]>((pickedStatements, slotIndex) => {
    const rankingForSlot = rankingsTakingTurns[slotIndex % rankingsTakingTurns.length];
    const nextStatement = rankingForSlot.find((statement) => !pickedStatements.includes(statement));
    return nextStatement ? [...pickedStatements, nextStatement] : pickedStatements;
  }, []);
}

export function pickBoardStatements(statements: Statement[], startedAt: number | null): Statement[] {
  const [attendeeStatements, seedStatements] = _.partition(
    statements.filter((statement) => !statement.isHidden),
    (statement) => isAttendeeStatement(statement, startedAt),
  );
  const attendeeStatementsOnBoard = pickAttendeeStatementsOnBoard(attendeeStatements);

  const seedStatementIdsOnBoard = new Set(
    _.orderBy(seedStatements, getVoteCount, "desc")
      .slice(0, BOARD_STATEMENT_LIMIT - attendeeStatementsOnBoard.length)
      .map((statement) => statement.id),
  );
  const seedStatementsOnBoard = seedStatements.filter((statement) => seedStatementIdsOnBoard.has(statement.id));
  return [...seedStatementsOnBoard, ...attendeeStatementsOnBoard];
}

export const sortByAgreeShare = (statements: Statement[]): Statement[] =>
  _.orderBy(statements, (statement) => getVoteShares(statement).agree, "desc");

export function findMostSplitStatementId(statements: Statement[]): string | null {
  const votedStatements = statements.filter((statement) => getVoteCount(statement) > 0);
  const mostSplitStatement = _.orderBy(votedStatements, [getAgreeDisagreeGap, getVoteCount], ["asc", "desc"])[0];
  return mostSplitStatement?.id ?? null;
}

export interface ConsensusColumns {
  agreeStatements: Statement[];
  splitStatements: Statement[];
}

export function splitIntoConsensusColumns(statements: Statement[]): ConsensusColumns {
  const agreeColumnSize = Math.min(
    CONSENSUS_COLUMN_SIZE,
    Math.ceil(statements.length / 2),
  );
  const agreeStatements = sortByAgreeShare(statements).slice(
    0,
    agreeColumnSize,
  );
  const remainingStatements = statements.filter(
    (statement) => !agreeStatements.includes(statement),
  );
  return {
    agreeStatements,
    splitStatements: _.orderBy(
      remainingStatements,
      getAgreeDisagreeGap,
      "asc",
    ).slice(0, CONSENSUS_COLUMN_SIZE),
  };
}

export function getLatestAttendeeStatement(statements: Statement[], startedAt: number | null): Statement | null {
  const visibleAttendeeStatements = statements.filter(
    (statement) => !statement.isHidden && isAttendeeStatement(statement, startedAt),
  );
  return _.maxBy(visibleAttendeeStatements, "timestamp") ?? null;
}

export type NewStatementStripMode = "empty" | "celebrating" | "collecting-votes" | "invite";

export function getNewStatementStripMode(
  latestAttendeeStatement: Statement | null,
  isLatestOnBoard: boolean,
  now: number,
): NewStatementStripMode {
  if (!latestAttendeeStatement) return "empty";
  const msSinceWritten = now - latestAttendeeStatement.timestamp;
  if (msSinceWritten < NEW_STATEMENT_CELEBRATE_MS) return "celebrating";
  if (isLatestOnBoard && msSinceWritten >= NEW_STATEMENT_INVITE_AFTER_MS) return "invite";
  return "collecting-votes";
}

export type DisplayScreen =
  | "join"
  | "loading"
  | "intro"
  | "board"
  | "end";

export function getDisplayScreen(
  eventState: Pick<
    LiveEventView,
    "status" | "currentIndex" | "currentRoomId" | "isIntroducingPost"
  >,
  loadedPostRoomId: string | null,
): DisplayScreen {
  if (eventState.status === "ended") return "end";
  if (
    eventState.status === "setup" ||
    eventState.status === "open" ||
    eventState.currentIndex === null
  )
    return "join";
  if (loadedPostRoomId !== eventState.currentRoomId) return "loading";
  return eventState.isIntroducingPost ? "intro" : "board";
}

export function formatJoinHeadcount(
  peopleHere: number,
  answeringQuestions: number,
): string {
  const readyCount = peopleHere - answeringQuestions;
  const personWord = pluralizePerson(readyCount);
  const readyText = `${readyCount} ${personWord} ready`;
  if (answeringQuestions === 0) return readyText;
  return `${readyText} · ${answeringQuestions} answering questions`;
}

export const HIDE_SCREEN_SHORTCUT_KEY = "b";

export function isHideScreenShortcut(
  keyboardEvent: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "altKey" | "repeat"
  >,
): boolean {
  const hasModifier =
    keyboardEvent.ctrlKey || keyboardEvent.metaKey || keyboardEvent.altKey;
  if (hasModifier || keyboardEvent.repeat) return false;
  return keyboardEvent.key.toLowerCase() === HIDE_SCREEN_SHORTCUT_KEY;
}
