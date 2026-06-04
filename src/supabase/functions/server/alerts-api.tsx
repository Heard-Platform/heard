// @ts-ignore
import { Context, Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { getAllDebates } from "./kv-utils.tsx";
import {
  getFollowedRoomIds,
  getRoomViewsForUser,
} from "./model-utils.ts";
import { isRoomEnded } from "./room-utils.ts";

const app = new Hono();

type RoomAlertReason = "new-activity" | "ended";

interface RoomAlertResponse {
  roomId: string;
  topic: string;
  emoji?: string;
  subHeard?: string;
  reason: RoomAlertReason;
  lastActivityAt: number;
}

app.get(
  "/make-server-f1a393b4/alerts/rooms",
  defineRoute(
    {},
    async (_params, c: Context) => {
      const userId = c.get("userId");
      if (!userId) throw new Error("Not authenticated");

      const [allRooms, views, followedRoomIds] = await Promise.all([
        getAllDebates(),
        getRoomViewsForUser(userId),
        getFollowedRoomIds(userId),
      ]);

      const lastSeenByRoomId = new Map<string, number>();
      for (const view of views) {
        lastSeenByRoomId.set(view.roomId, view.lastSeenAt);
      }

      const followedRooms = allRooms.filter((room) =>
        followedRoomIds.has(room.id),
      );

      const alerts: RoomAlertResponse[] = [];
      for (const room of followedRooms) {
        const lastSeenAt = lastSeenByRoomId.get(room.id);
        if (lastSeenAt === undefined) continue;

        const lastActivityAt = room.lastActivityAt ?? room.createdAt;
        const ended = isRoomEnded(room);
        const endSignalAt = Math.max(lastActivityAt, room.endTime ?? 0);

        let reason: RoomAlertReason | null = null;
        if (ended && lastSeenAt < endSignalAt) {
          reason = "ended";
        } else if (lastActivityAt > lastSeenAt) {
          reason = "new-activity";
        }

        if (reason) {
          alerts.push({
            roomId: room.id,
            topic: room.topic,
            emoji: room.emoji,
            subHeard: room.subHeard,
            reason,
            lastActivityAt,
          });
        }
      }

      alerts.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

      return { alerts };
    },
    "Failed to fetch room alerts",
  ),
);

export { app as alertsApi };
