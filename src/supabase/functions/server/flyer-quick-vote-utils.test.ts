import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { countAgreesAndDisagreesWithNewVote } from "./flyer-quick-vote-utils.ts";

const storedCounts = { agrees: 10, disagrees: 4 };

describe("countAgreesAndDisagreesWithNewVote", () => {
  it("adds a first agree", () => {
    assertEquals(countAgreesAndDisagreesWithNewVote(storedCounts, null, "agree"), {
      agreeCount: 11,
      disagreeCount: 4,
    });
  });

  it("adds a first disagree", () => {
    assertEquals(countAgreesAndDisagreesWithNewVote(storedCounts, null, "disagree"), {
      agreeCount: 10,
      disagreeCount: 5,
    });
  });

  it("counts a super agree as an agree", () => {
    assertEquals(countAgreesAndDisagreesWithNewVote(storedCounts, null, "super_agree"), {
      agreeCount: 11,
      disagreeCount: 4,
    });
  });

  it("leaves the counts alone for a first pass", () => {
    assertEquals(countAgreesAndDisagreesWithNewVote(storedCounts, null, "pass"), {
      agreeCount: 10,
      disagreeCount: 4,
    });
  });

  it("leaves the counts alone when the same vote is cast again", () => {
    assertEquals(countAgreesAndDisagreesWithNewVote(storedCounts, "agree", "agree"), {
      agreeCount: 10,
      disagreeCount: 4,
    });
  });

  it("moves a vote from agree to disagree", () => {
    assertEquals(countAgreesAndDisagreesWithNewVote(storedCounts, "agree", "disagree"), {
      agreeCount: 9,
      disagreeCount: 5,
    });
  });

  it("moves a vote from disagree to agree", () => {
    assertEquals(countAgreesAndDisagreesWithNewVote(storedCounts, "disagree", "agree"), {
      agreeCount: 11,
      disagreeCount: 3,
    });
  });

  it("never goes below zero when the stored counts lag behind", () => {
    assertEquals(
      countAgreesAndDisagreesWithNewVote({ agrees: 0, disagrees: 0 }, "agree", "disagree"),
      { agreeCount: 0, disagreeCount: 1 },
    );
  });
});
