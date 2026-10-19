import { Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import {
  getAllDebates,
  getStatementsForRoom,
  getVotesForUser,
} from "./kv-utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { isRoomEnded } from "./room-utils.ts";
import {
  buildSwipeSix,
  DC_SUBHEARD,
  FUN_SUBHEARDS,
  pickRecentRooms,
  pickTwoPosts,
  SwipeSixPost,
} from "./swipe-six-utils.ts";
import type { DebateRoom } from "./types.tsx";

// Routes behind the dev tools Testing tab.
const app = new Hono();

app.get(
  `${API_URL_PREFIX}/dev/swipe-six`,
  defineRoute(
    {},
    async (_params, c) => {
      const userId = c.get("userId");
      if (!userId) throw new Error("Sign in to build your swipe six");
      const allRooms = await getAllDebates();
      const votes = await getVotesForUser(userId);
      const votedIds = new Set(votes.map((v) => v.statementId));
      const liveRooms = allRooms.filter((room) => !room.isTestRoom && !isRoomEnded(room));
      const now = Date.now();

      // Recent rooms whose unvoted statements are enough for the swipe six.
      const getEligiblePosts = async (rooms: DebateRoom[], stmtMinCount: number): Promise<SwipeSixPost[]> => {
        const eligiblePosts: SwipeSixPost[] = [];
        for (const room of pickRecentRooms(rooms, now)) {
          const statements = await getStatementsForRoom(room.id);
          const unvotedStatements = statements.filter((s) => !votedIds.has(s.id));
          if (unvotedStatements.length >= stmtMinCount) {
            eligiblePosts.push({ room, unvotedStatements });
          }
        }
        return eligiblePosts;
      };

      const dcRooms = liveRooms.filter((r) => r.subHeard === DC_SUBHEARD);
      const eligibleDcPosts = await getEligiblePosts(dcRooms, 2);
      const dcPosts = pickTwoPosts(eligibleDcPosts);

      const funRooms = liveRooms.filter((r) => FUN_SUBHEARDS.includes(r.subHeard ?? ""));
      const eligibleFunPosts = await getEligiblePosts(funRooms, 1);
      const funPosts = pickTwoPosts(eligibleFunPosts);

      return { items: buildSwipeSix(dcPosts, funPosts) };
    },
    "Failed to build swipe six",
  ),
);

export { app as devTestingApi };
