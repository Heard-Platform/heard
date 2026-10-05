import { describe, expect, it } from "vitest";
import { getStandingHeadline } from "./flyer-scan-headline";

describe("getStandingHeadline", () => {
  it("shows the share of DC on their side when they're in the majority", () => {
    expect(getStandingHeadline({ vote: "agree", agreePercent: 63, areResultsTomorrow: false })).toBe(
      "You're with 63% of DC right now. Will it hold?",
    );
  });

  it("uses the disagree share for people who disagreed", () => {
    expect(getStandingHeadline({ vote: "disagree", agreePercent: 30, areResultsTomorrow: false })).toBe(
      "You're with 70% of DC right now. Will it hold?",
    );
  });

  it("treats exactly 55% as the majority", () => {
    expect(getStandingHeadline({ vote: "agree", agreePercent: 55, areResultsTomorrow: false })).toBe(
      "You're with 55% of DC right now. Will it hold?",
    );
  });

  it("calls out the minority below 45%", () => {
    expect(getStandingHeadline({ vote: "agree", agreePercent: 44, areResultsTomorrow: false })).toBe(
      "You're in the minority right now. Will DC come around?",
    );
  });

  it("calls a 45–55% split too close", () => {
    expect(getStandingHeadline({ vote: "disagree", agreePercent: 52, areResultsTomorrow: false })).toBe(
      "Too close to call. Find out tonight at 7pm.",
    );
  });

  it("says tomorrow when the results drop tomorrow", () => {
    expect(getStandingHeadline({ vote: "agree", agreePercent: 50, areResultsTomorrow: true })).toBe(
      "Too close to call. Find out tomorrow at 7pm.",
    );
  });
});
