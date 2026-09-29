import { Context, Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import {
  getAllClusterIdentityRecords,
  getAllDebates,
  getClusterIdentityRecord,
  getDebate,
} from "./kv-utils.tsx";
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

export interface ReviewRoomOption {
  roomId: string;
  topic: string;
  voteCount: number;
  createdAt: number;
}

export interface ClusterNameReviewRoom {
  roomId: string;
  topic: string;
  voteCount: number;
  clusters: ClusterNameReviewCluster[] | null;
  lastNamedAt: number | null;
  createdAt: number;
}

function toRoomOption(room: DebateRoom): ReviewRoomOption {
  return {
    roomId: room.id,
    topic: room.topic,
    voteCount: room.totalVotes ?? 0,
    createdAt: room.createdAt,
  };
}

function lastNamedAt(identity: ClusterIdentityRecord | null): number | null {
  const times = (identity?.clusters ?? [])
    .map((c) => c.naming?.namedAt)
    .filter((t): t is number => t !== undefined);
  return times.length > 0 ? Math.max(...times) : null;
}

function toReviewRoom(room: DebateRoom, identity: ClusterIdentityRecord | null): ClusterNameReviewRoom {
  return {
    roomId: room.id,
    topic: room.topic,
    voteCount: room.totalVotes ?? 0,
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
    lastNamedAt: lastNamedAt(identity),
    createdAt: room.createdAt,
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

      const [rooms, identities] = await Promise.all([getAllDebates(), getAllClusterIdentityRecords()]);
      const named = rooms
        .map((room) => toReviewRoom(room, identities.get(room.id) ?? null))
        .filter((room) => room.lastNamedAt !== null)
        .sort((a, b) => b.lastNamedAt! - a.lastNamedAt!);

      return {
        rooms: named.slice(offset, offset + limit),
        hasMore: offset + limit < named.length,
      };
    },
    "Failed to fetch cluster names for review",
  ),
);

app.get(
  `${API_URL_PREFIX}/dev/ai-review/rooms`,
  defineRoute(
    {},
    async () => {
      const rooms = (await getAllDebates())
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(toRoomOption);
      return { rooms };
    },
    "Failed to fetch rooms",
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

      if (await getClusterIdentityRecord(roomId)) {
        await nameClustersForRoom(roomId, "force");
      }

      return { room: toReviewRoom(room, await getClusterIdentityRecord(roomId)) };
    },
    "Failed to regenerate cluster names",
  ),
);

export { app as aiReviewClustersApi };
