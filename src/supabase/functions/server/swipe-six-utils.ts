import _ from "lodash";
import type { DebateRoom, Statement } from "./types.tsx";
import { ONE_DAY_MS } from "./time-utils.ts";

export const DC_SUBHEARD = "washington-dc";
export const FUN_SUBHEARDS = [
  "change-my-mind",
  "advice",
  "music",
  "cooking",
  "hot-takes",
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
  _.orderBy(_.sampleSize(posts, 2), (post: SwipeSixPost) => post.unvotedStatements.length, "desc");

const pickRandomStmts = (post: SwipeSixPost | undefined, count: number): SwipeSixItem[] =>
  post
    ? _.sampleSize(post.unvotedStatements, count).map(
        (statement: Statement) => ({ statement, room: post.room }),
      )
    : [];

export const buildSwipeSix = (
  dcPosts: SwipeSixPost[],
  funPost: SwipeSixPost | undefined,
): SwipeSixItem[] => {
  const [dcPost1, dcPost2] = dcPosts;
  return [
    ...pickRandomStmts(dcPost1, 3),
    ...pickRandomStmts(dcPost2, 2),
    ...pickRandomStmts(funPost, 1),
  ];
};

export const buildRoomSwipeSix = (post: SwipeSixPost): SwipeSixItem[] =>
  pickRandomStmts(post, 6);
