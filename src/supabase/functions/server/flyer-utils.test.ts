import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { recountVotes } from "./flyer-utils.ts";

const storedCounts = { agrees: 10, disagrees: 4 };

describe("recountVotes", () => {
  it("adds a first agree", () => {
    assertEquals(recountVotes(storedCounts, null, "agree"), {
      agreeCount: 11,
      disagreeCount: 4,
    });
  });

  it("adds a first disagree", () => {
    assertEquals(recountVotes(storedCounts, null, "disagree"), {
      agreeCount: 10,
      disagreeCount: 5,
    });
  });

  it("counts a super agree as an agree", () => {
    assertEquals(recountVotes(storedCounts, null, "super_agree"), {
      agreeCount: 11,
      disagreeCount: 4,
    });
  });

  it("leaves the counts alone for a first pass", () => {
    assertEquals(recountVotes(storedCounts, null, "pass"), {
      agreeCount: 10,
      disagreeCount: 4,
    });
  });

  it("leaves the counts alone when the same vote is cast again", () => {
    assertEquals(recountVotes(storedCounts, "agree", "agree"), {
      agreeCount: 10,
      disagreeCount: 4,
    });
  });

  it("moves a vote from agree to disagree", () => {
    assertEquals(recountVotes(storedCounts, "agree", "disagree"), {
      agreeCount: 9,
      disagreeCount: 5,
    });
  });

  it("moves a vote from disagree to agree", () => {
    assertEquals(recountVotes(storedCounts, "disagree", "agree"), {
      agreeCount: 11,
      disagreeCount: 3,
    });
  });

  it("never goes below zero when the stored counts lag behind", () => {
    assertEquals(
      recountVotes({ agrees: 0, disagrees: 0 }, "agree", "disagree"),
      { agreeCount: 0, disagreeCount: 1 },
    );
  });
});
