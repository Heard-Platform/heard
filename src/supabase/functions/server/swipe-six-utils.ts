import _ from "lodash";
import type { DebateRoom, Statement } from "./types.tsx";
import { ONE_DAY_MS } from "./time-utils.ts";

export const DC_SUBHEARD = "washington-dc";
export const FUN_SUBHEARDS = [
  "change-my-mind",
  "advice",
  "music",
  "cooking",
  "spicy-opinions",
  "learning",
  "hygiene",
];
const SWIPE_SIX_WINDOW_MS = 14 * ONE_DAY_MS;
const SWIPE_SIX_MIN_ROOMS = 6;

export interface SwipeSixPost {
  room: DebateRoom;
  unvotedStatements: Statement[];
}

export interface SwipeSixItem {
  statement: Statement;
  room: DebateRoom;
}

// Most recent rooms in the pool: everything inside the window, or the newest
// SWIPE_SIX_MIN_ROOMS if the window is too thin.
export const pickRecentRooms = (rooms: DebateRoom[], now: number): DebateRoom[] => {
  const newestFirst: DebateRoom[] = _.orderBy(rooms, "createdAt", "desc");
  const inWindow = newestFirst.filter((room: DebateRoom) => now - room.createdAt < SWIPE_SIX_WINDOW_MS);
  return inWindow.length >= SWIPE_SIX_MIN_ROOMS ? inWindow : newestFirst.slice(0, SWIPE_SIX_MIN_ROOMS);
};

export const pickTwoPosts = (posts: SwipeSixPost[]): SwipeSixPost[] =>
  _.sampleSize(posts, 2);

export const buildSwipeSix = (
  dcPosts: SwipeSixPost[],
  funPosts: SwipeSixPost[],
): SwipeSixItem[] => {
  const [dcPost1, dcPost2] = dcPosts;
  const [funPost1, funPost2] = funPosts;

  const pickRandomStmts = (
    post: SwipeSixPost | undefined,
    count: number,
  ): SwipeSixItem[] =>
    post
      ? _.sampleSize(post.unvotedStatements, count).map(
          (statement: Statement) => ({ statement, room: post.room }),
        )
      : [];

  return [
    ...pickRandomStmts(dcPost1, 2),
    ...pickRandomStmts(funPost1, 1),
    ...pickRandomStmts(dcPost2, 2),
    ...pickRandomStmts(funPost2, 1),
  ];
};
