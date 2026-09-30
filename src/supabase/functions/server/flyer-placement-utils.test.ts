import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { attachVoteCounts, countFlyerVotes, findFlyerPlacementsError } from "./flyer-placement-utils.ts";
import type { FlyerPlacement, Vote, VoteType } from "./types.tsx";

const vote = (voteType: VoteType, flyerGroup?: number): Vote => ({
  id: `${voteType}-${flyerGroup}-${Math.random()}`,
  statementId: "stmt",
  userId: "user",
  voteType,
  timestamp: 0,
  ...(flyerGroup === undefined ? {} : { flyerId: "room", flyerGroup }),
});

const flyer = (flyerGroup: number, overrides: Record<string, unknown> = {}) => ({
  flyerGroup,
  latitude: 38.9,
  longitude: -77.0,
  headingDeg: null,
  ...overrides,
});

describe("countFlyerVotes", () => {
  it("counts only votes from that flyer's scans", () => {
    const votes = [vote("agree", 3), vote("disagree", 3), vote("agree", 4), vote("agree")];
    assertEquals(countFlyerVotes(votes, 3), { agrees: 1, disagrees: 1 });
  });

  it("treats super agree as agree and ignores passes", () => {
    const votes = [vote("super_agree", 3), vote("pass", 3), vote("agree", 3)];
    assertEquals(countFlyerVotes(votes, 3), { agrees: 2, disagrees: 0 });
  });
});

describe("attachVoteCounts", () => {
  it("uses each placement's own statement votes", () => {
    const placement: FlyerPlacement = {
      id: "p1",
      roomId: "room",
      statementId: "stmt",
      flyerGroup: 3,
      latitude: 38.9,
      longitude: -77.0,
      headingDeg: 90,
      createdBy: "dev",
      createdAt: "2026-09-24T00:00:00Z",
    };
    const [withVotes] = attachVoteCounts([placement], new Map([["stmt", [vote("disagree", 3)]]]));
    assertEquals(withVotes.agrees, 0);
    assertEquals(withVotes.disagrees, 1);
  });
});

describe("findFlyerPlacementsError", () => {
  it("accepts valid new flyers", () => {
    assertEquals(findFlyerPlacementsError([flyer(1), flyer(2, { headingDeg: 359 })], new Set([5])), null);
  });

  it("rejects an empty save", () => {
    assertEquals(findFlyerPlacementsError([], new Set()), "No flyers to save");
  });

  it("rejects invalid groups, coordinates and headings", () => {
    for (const invalid of [flyer(0), flyer(1.5), flyer(1, { latitude: 91 }), flyer(1, { headingDeg: 360 })]) {
      assertEquals(typeof findFlyerPlacementsError([invalid], new Set()), "string");
    }
  });

  it("rejects groups repeated in the save or already saved", () => {
    assertEquals(
      findFlyerPlacementsError([flyer(1), flyer(1)], new Set()),
      "Flyer groups are used more than once: 1",
    );
    assertEquals(
      findFlyerPlacementsError([flyer(4), flyer(5)], new Set([5])),
      "Flyer groups are already saved for this statement: 5",
    );
  });
});
