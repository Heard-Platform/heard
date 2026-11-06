import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import {
  isAgreeVote,
  isDisagreeVote,
  toSimpleVote,
} from "./vote-type-utils.ts";

describe("toSimpleVote", () => {
  it("counts a super agree as an agree", () => {
    assertEquals(toSimpleVote("super_agree"), "agree");
  });

  it("leaves every other vote as it is", () => {
    assertEquals(toSimpleVote("agree"), "agree");
    assertEquals(toSimpleVote("disagree"), "disagree");
    assertEquals(toSimpleVote("pass"), "pass");
  });
});

describe("isAgreeVote", () => {
  it("counts agree and super agree as agree", () => {
    assertEquals(isAgreeVote("agree"), true);
    assertEquals(isAgreeVote("super_agree"), true);
  });

  it("does not count disagree, pass or no vote as agree", () => {
    assertEquals(isAgreeVote("disagree"), false);
    assertEquals(isAgreeVote("pass"), false);
    assertEquals(isAgreeVote(null), false);
  });
});

describe("isDisagreeVote", () => {
  it("counts only disagree", () => {
    assertEquals(isDisagreeVote("disagree"), true);
    assertEquals(isDisagreeVote("agree"), false);
    assertEquals(isDisagreeVote("super_agree"), false);
    assertEquals(isDisagreeVote("pass"), false);
    assertEquals(isDisagreeVote(null), false);
  });
});
