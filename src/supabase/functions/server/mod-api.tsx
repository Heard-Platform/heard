import { Hono } from "npm:hono";
import { deleteRecord, insert } from "./db-utils.ts";
import { validateTrueHost } from "./auth-utils.ts";
import { defineRoute } from "./route-wrapper.tsx";
import { getMergesForRoom } from "./model-utils.ts";
import {
  generateId,
  getDebateRoom,
  getStatementById,
  getStatements,
  saveDebateRoom,
} from "./debate-api.tsx";
import {
  getClusterAssignmentsBatch,
  getStatementsForRoomIncludingHidden,
  getUser,
  saveCohostInvite,
  saveStatement,
} from "./kv-utils.tsx";
import { markStatementHidden, markStatementVisible } from "./moderation-utils.ts";
import { ONE_DAY_MS } from "./time-utils.ts";
import { DebateRoom } from "./types.tsx";

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

app.get(
  `${PREFIX}/vote-matrix`,
  defineRoute(
    {},
    async (_params, c) => {
      const roomId = c.req.param("roomId") as string;
      const [statements, merges] = await Promise.all([
        getStatements(roomId),
        getMergesForRoom(roomId),
      ]);
      const userIds = Array.from(
        new Set(statements.flatMap((s) => [s.author, ...Object.keys(s.voters ?? {})]))
      );
      const [users, clusterAssignments] = await Promise.all([
        Promise.all(userIds.map((id) => getUser(id))),
        getClusterAssignmentsBatch(roomId, userIds),
      ]);
      const phoneVerified: Record<string, boolean> = {};
      const userClusters: Record<string, number> = {};
      for (let i = 0; i < userIds.length; i++) {
        if (users[i]?.phoneVerified) phoneVerified[userIds[i]] = true;
        const assignment = clusterAssignments.get(userIds[i]);
        if (assignment) userClusters[userIds[i]] = assignment.clusterId;
      }
      return { statements, merges, phoneVerified, userClusters };
    },
    "Failed to fetch vote matrix",
  ),
);

app.get(
  `${PREFIX}/statements`,
  defineRoute(
    { roomId: { type: "string", required: true } },
    async ({ roomId }: { roomId: string }) => {
      const statements = await getStatementsForRoomIncludingHidden(roomId);
      return { statements };
    },
    "Failed to fetch statements",
  ),
);

app.post(
  `${PREFIX}/statement/:statementId/hidden`,
  defineRoute(
    {
      roomId: { type: "string", required: true },
      statementId: { type: "string", required: true },
      isHidden: { type: "boolean", required: true },
    },
    async (
      {
        roomId,
        statementId,
        isHidden,
      }: { roomId: string; statementId: string; isHidden: boolean },
      c,
    ) => {
      const userId = c.get("userId");

      const statement = await getStatementById(statementId);
      if (!statement || statement.roomId !== roomId) {
        throw new Error("Statement not found");
      }

      const updated = isHidden
        ? markStatementHidden(statement, userId)
        : markStatementVisible(statement);
      await saveStatement(updated);
      return { statement: updated };
    },
    "Failed to update statement visibility",
  ),
);

app.post(
  `${PREFIX}/edit`,
  defineRoute(
    {
      roomId: { type: "string", required: true },
      topic: { type: "string" },
      description: { type: "string" },
      imageUrl: { type: "string" },
      endTime: { type: "number" },
    },
    async (
      { roomId, topic, description, imageUrl, endTime }: {
        roomId: string;
        topic?: string;
        description?: string;
        imageUrl?: string;
        endTime?: number;
      },
    ) => {
      const room = await getDebateRoom(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      if (topic !== undefined) room.topic = topic;
      if (description !== undefined) room.description = description;
      if (imageUrl !== undefined) room.imageUrl = imageUrl;
      if (endTime !== undefined) room.endTime = endTime;

      await saveDebateRoom(room);
      return { room };
    },
    "Failed to update room",
  ),
);

app.post(
  `${PREFIX}/responses-paused`,
  defineRoute(
    {
      roomId: { type: "string", required: true },
      paused: { type: "boolean", required: true },
    },
    async ({ roomId, paused }: { roomId: string; paused: boolean }, c) => {
      const userId = c.get("userId");

      const room = await getDebateRoom(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      const updated: DebateRoom = {
        ...room,
        responsesPaused: paused ? true : null,
        responsesPausedAt: paused ? Date.now() : null,
        responsesPausedBy: paused ? userId : null,
      };
      await saveDebateRoom(updated);
      return { room: updated };
    },
    "Failed to update responses paused state",
  ),
);

app.post(
  `${PREFIX}/cohost-invite`,
  validateTrueHost,
  defineRoute(
    { roomId: { type: "string", required: true } },
    async ({ roomId }: { roomId: string }, c) => {
      const userId = c.get("userId");

      const room = await getDebateRoom(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      const token = generateId();
      await saveCohostInvite(token, {
        roomId,
        createdBy: userId,
        expiresAt: Date.now() + ONE_DAY_MS,
      });

      return { token };
    },
    "Failed to create co-host invite",
  ),
);

export { app as modApi };
