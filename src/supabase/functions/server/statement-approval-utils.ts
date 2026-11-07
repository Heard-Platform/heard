import {
  markStatementHidden,
  markStatementVisible,
  STATEMENT_APPROVAL_HIDER,
} from "./moderation-utils.ts";
import {
  getAllStatements,
  getDebate,
  getStatement,
  saveStatement,
} from "./kv-utils.tsx";
import { RouteError } from "./route-error.ts";
import { getFrontendUrl } from "./utils.tsx";
import type {
  RoomAwaitingApproval,
  Statement,
  StatementApprovalDecision,
} from "./types.tsx";

export const isStatementApprovalDecision = (
  value: unknown,
): value is StatementApprovalDecision =>
  value === "approve" || value === "reject";

export const isStatementAwaitingApproval = (
  statement: Statement,
): boolean =>
  !!statement.isHidden &&
  statement.hiddenBy === STATEMENT_APPROVAL_HIDER;

export const applyApprovalDecision = (
  statement: Statement,
  decision: StatementApprovalDecision,
  developerId: string,
  now: number = Date.now(),
): Statement =>
  decision === "approve"
    ? markStatementVisible(statement)
    : markStatementHidden(statement, developerId, now);

export const buildStatementApprovalPageUrl = (): string =>
  `${getFrontendUrl()}/statement-approval`;

export const groupStatementsByRoom = (
  statements: Statement[],
): Map<string, Statement[]> => {
  const statementsByRoomId = new Map<string, Statement[]>();
  for (const statement of statements) {
    const roomStatements =
      statementsByRoomId.get(statement.roomId) ?? [];
    roomStatements.push(statement);
    statementsByRoomId.set(statement.roomId, roomStatements);
  }
  return statementsByRoomId;
};

const sortOldestFirst = (statements: Statement[]): Statement[] =>
  [...statements].sort((a, b) => a.timestamp - b.timestamp);

export const getRoomsAwaitingApproval = async (): Promise<{
  rooms: RoomAwaitingApproval[];
}> => {
  const statementsAwaitingApproval = (
    await getAllStatements()
  ).filter(isStatementAwaitingApproval);
  const statementsByRoomId = groupStatementsByRoom(
    sortOldestFirst(statementsAwaitingApproval),
  );

  const rooms = await Promise.all(
    [...statementsByRoomId.keys()].map(async (roomId) => {
      const room = await getDebate(roomId);
      return {
        roomId,
        topic: room?.topic ?? "",
        statements: statementsByRoomId.get(roomId) ?? [],
      };
    }),
  );
  return { rooms };
};

export const decideStatementApproval = async (
  roomId: string,
  statementId: string,
  decision: StatementApprovalDecision,
  developerId: string,
): Promise<{ statement: Statement }> => {
  const statement = await getStatement(roomId, statementId);
  if (!statement) {
    throw new RouteError("Statement not found", 404);
  }
  if (!isStatementAwaitingApproval(statement)) {
    throw new RouteError(
      "This statement isn't awaiting approval",
      409,
    );
  }

  const decidedStatement = applyApprovalDecision(
    statement,
    decision,
    developerId,
  );
  await saveStatement(decidedStatement);
  return { statement: decidedStatement };
};
