import { Context, Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { getAllDebates, getClusterIdentityRecord, getDebate } from "./kv-utils.tsx";
import { recalculateClustersForRoom } from "./clustering.tsx";
import { nameClustersForRoom } from "./cluster-naming.ts";
import { ClusterIdentityRecord } from "./cluster-identity.ts";
import { DebateRoom } from "./types.tsx";

const app = new Hono();

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export interface ClusterNameReviewCluster {
  stableId: string;
  slot: number;
  size: number;
  name: string | null;
  previousName: string | null;
  renameReason: string | null;
}

export interface ClusterNameReviewRoom {
  roomId: string;
  topic: string;
  createdAt: number;
  clusters: ClusterNameReviewCluster[] | null;
}

function toReviewRoom(room: DebateRoom, identity: ClusterIdentityRecord | null): ClusterNameReviewRoom {
  return {
    roomId: room.id,
    topic: room.topic,
    createdAt: room.createdAt,
    clusters: identity
      ? identity.clusters
        .map((c) => ({
          stableId: c.stableId,
          slot: c.slot,
          size: c.memberIds.length,
          name: c.naming?.name ?? null,
          previousName: c.naming?.previousName ?? null,
          renameReason: c.naming?.renameReason ?? null,
        }))
        .sort((a, b) => b.size - a.size)
      : null,
  };
}

function parsePageParam(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

app.get(
  `${API_URL_PREFIX}/dev/ai-review/cluster-names`,
  defineRoute(
    {},
    async (_params, c: Context) => {
      const offset = parsePageParam(c.req.query("offset"), 0, Number.MAX_SAFE_INTEGER);
      const limit = parsePageParam(c.req.query("limit"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

      const rooms = (await getAllDebates()).sort((a, b) => b.createdAt - a.createdAt);
      const page = rooms.slice(offset, offset + limit);
      const identities = await Promise.all(page.map((room) => getClusterIdentityRecord(room.id)));

      return {
        rooms: page.map((room, i) => toReviewRoom(room, identities[i])),
        hasMore: offset + limit < rooms.length,
      };
    },
    "Failed to fetch cluster names for review",
  ),
);

app.post(
  `${API_URL_PREFIX}/dev/room/:roomId/cluster-names/regenerate`,
  defineRoute(
    { roomId: { type: "string", required: true } },
    async ({ roomId }: { roomId: string }) => {
      const room = await getDebate(roomId);
      if (!room) throw new Error("Room not found");

      if (!(await getClusterIdentityRecord(roomId))) {
        await recalculateClustersForRoom(roomId);
      }

      const identity = await getClusterIdentityRecord(roomId);
      if (identity) {
        await nameClustersForRoom(roomId, "force");
      }

      return { room: toReviewRoom(room, await getClusterIdentityRecord(roomId)) };
    },
    "Failed to regenerate cluster names",
  ),
);

export { app as aiReviewApi };
