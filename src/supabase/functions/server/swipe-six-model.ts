import * as kv from "./kv_store.tsx";
import {
  getAllDebates,
  getByPrefixParsed,
  getParsedKvData,
  getStatementsForRoom,
  getVotesForUser,
} from "./kv-utils.tsx";
import { isRoomEnded } from "./room-utils.ts";
import {
  buildSwipeSix,
  DC_SUBHEARD,
  FUN_SUBHEARDS,
  pickRecentRooms,
  pickTwoPosts,
  SwipeSixItem,
  SwipeSixPost,
} from "./swipe-six-utils.ts";
import type { DebateRoom } from "./types.tsx";

export interface SwipeSixCompletion {
  userId: string;
  localDate: string;
  completedAt: number;
}

const completionKeyFn = (userId: string, localDate: string) =>
  `swipe_six_done:${userId}:${localDate}`;

export const getSwipeSixCompletion = (userId: string, localDate: string) =>
  getParsedKvData<SwipeSixCompletion>(completionKeyFn(userId, localDate));

export const saveSwipeSixCompletion = async (completion: SwipeSixCompletion) => {
  await kv.set(
    completionKeyFn(completion.userId, completion.localDate),
    JSON.stringify(completion),
  );
};

export const getAllSwipeSixCompletions = () =>
  getByPrefixParsed<SwipeSixCompletion>("swipe_six_done:");

// Today's six for a user: 2 DC, 1 fun, 2 DC, 1 fun, from recent posts,
// skipping statements they've already voted on.
export const buildSwipeSixForUser = async (userId: string): Promise<SwipeSixItem[]> => {
  const [allRooms, votes] = await Promise.all([getAllDebates(), getVotesForUser(userId)]);
  const votedIds = new Set(votes.map((v) => v.statementId));
  const liveRooms = allRooms.filter((room) => !room.isTestRoom && !isRoomEnded(room));
  const now = Date.now();

  // Recent rooms whose unvoted statements are enough for the swipe six, fetched in parallel.
  const getEligiblePosts = async (rooms: DebateRoom[], stmtMinCount: number): Promise<SwipeSixPost[]> => {
    const posts = await Promise.all(
      pickRecentRooms(rooms, now).map(async (room) => {
        const statements = await getStatementsForRoom(room.id);
        return { room, unvotedStatements: statements.filter((s) => !votedIds.has(s.id)) };
      }),
    );
    return posts.filter((post) => post.unvotedStatements.length >= stmtMinCount);
  };

  const dcRooms = liveRooms.filter((r) => r.subHeard === DC_SUBHEARD);
  const funRooms = liveRooms.filter((r) => FUN_SUBHEARDS.includes(r.subHeard ?? ""));
  const [eligibleDcPosts, eligibleFunPosts] = await Promise.all([
    getEligiblePosts(dcRooms, 2),
    getEligiblePosts(funRooms, 1),
  ]);

  const dcPosts = pickTwoPosts(eligibleDcPosts);
  const funPosts = pickTwoPosts(eligibleFunPosts);

  return buildSwipeSix(dcPosts, funPosts);
};
