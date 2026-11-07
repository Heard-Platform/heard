import { Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import {
  decideStatementApproval,
  getRoomsAwaitingApproval,
  isStatementApprovalDecision,
} from "./statement-approval-utils.ts";
import type { StatementApprovalDecision } from "./types.tsx";

const STATEMENT_APPROVAL_PATH = `${API_URL_PREFIX}/dev/statement-approval`;

const statementApprovalApi = new Hono();

statementApprovalApi.get(
  STATEMENT_APPROVAL_PATH,
  defineRoute(
    {},
    () => getRoomsAwaitingApproval(),
    "Failed to load statements awaiting approval",
  ),
);

statementApprovalApi.post(
  `${STATEMENT_APPROVAL_PATH}/:roomId/:statementId`,
  defineRoute(
    {
      roomId: { type: "string", required: true },
      statementId: { type: "string", required: true },
      decision: {
        type: "string",
        required: true,
        validate: isStatementApprovalDecision,
      },
    },
    (
      {
        roomId,
        statementId,
        decision,
      }: {
        roomId: string;
        statementId: string;
        decision: StatementApprovalDecision;
      },
      c,
    ) =>
      decideStatementApproval(
        roomId,
        statementId,
        decision,
        c.get("userId"),
      ),
    "Failed to decide statement approval",
  ),
);

export { statementApprovalApi };
