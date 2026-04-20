import { Hono } from "npm:hono";
import { createClientFromEnv, deleteRecord, insert } from "./db-utils.ts";
import { defineRoute } from "./route-wrapper.tsx";
import { getMergesForRoom } from "./model-utils.ts";

const app = new Hono();
const PREFIX = "/make-server-f1a393b4/room/:roomId/mod";

app.get(
  `${PREFIX}/statement-merges`,
  defineRoute(
    {},
    async (_params, c) => {
      const roomId = c.req.param("roomId") as string;
      const merges = await getMergesForRoom(roomId);
      return { merges };
    },
    "Failed to fetch merges",
  ),
);

app.post(
  `${PREFIX}/statement-merges`,
  defineRoute(
    {
      sourceStatementId: { type: "string", required: true },
      targetStatementId: { type: "string", required: true },
    },
    async ({ sourceStatementId, targetStatementId }, c) => {
      const roomId = c.req.param("roomId") as string;
      const userId = c.get("userId");

      if (sourceStatementId === targetStatementId) {
        throw new Error("Source and target must be different statements");
      }

      const existingMerges = await getMergesForRoom(roomId);
      if (existingMerges.some((m) => m.targetStatementId === sourceStatementId)) {
        throw new Error("Source statement is already a merge target. Merge chains are not supported.");
      }

      await insert("statement_merges", {
        roomId,
        sourceStatementId,
        targetStatementId,
        creatorId: userId,
      });
    },
    "Failed to create merge",
  ),
);

app.delete(
  `${PREFIX}/statement-merges/:mergeId`,
  defineRoute(
    {},
    async (_params, c) => {
      const mergeId = c.req.param("mergeId");
      await deleteRecord("statement_merges", { id: mergeId });
    },
    "Failed to delete merge",
  ),
);

export { app as modApi };
