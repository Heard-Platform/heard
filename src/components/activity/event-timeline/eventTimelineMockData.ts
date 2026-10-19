import type { UserEvent } from "../../../types";
import { ONE_DAY_MS, ONE_HOUR_MS } from "../../../utils/time";

const USER_IDS = [
  "3f2a9c1e-river",
  "8b41d7a0-mossy",
  "c09e5f22-fern",
  "51d8ab3c-cedar",
  "e7a26f90-elm",
];
const ROOM_IDS = ["a1b2c3d4-room", "f5e6d7c8-room"];

// Daily volume per type, oldest day first — shaped like a real week (page loads dominate).
const DAILY_VOLUME: Record<string, number[]> = {
  initial_load: [42, 38, 51, 47, 60, 33, 29],
  swipe_six_vote: [12, 15, 9, 22, 30, 11, 8],
  flyer_landing_view: [0, 3, 6, 2, 0, 0, 1],
  room_share_clicked: [1, 0, 2, 4, 3, 0, 1],
  organizers_cta_clicked: [0, 0, 0, 1, 0, 0, 0],
};

export function buildMockRecentEvents(now: number): UserEvent[] {
  const events: UserEvent[] = [];
  let seq = 0;

  for (const [type, perDay] of Object.entries(DAILY_VOLUME)) {
    perDay.forEach((count, dayIndex) => {
      const dayStart = new Date(now - (perDay.length - 1 - dayIndex) * ONE_DAY_MS);
      dayStart.setHours(0, 0, 0, 0);
      for (let i = 0; i < count; i++) {
        seq += 1;
        events.push({
          id: `mock-${seq}`,
          type,
          userId: USER_IDS[seq % USER_IDS.length],
          roomId: type.startsWith("room_") ? ROOM_IDS[seq % ROOM_IDS.length] : undefined,
          url: `https://heard.vote/${type.startsWith("flyer_") ? "parklet" : ""}`,
          createdAt: Math.min(now, dayStart.getTime() + ((seq * 37) % 23) * ONE_HOUR_MS),
        });
      }
    });
  }

  return events;
}
