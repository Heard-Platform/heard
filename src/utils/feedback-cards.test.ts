import { describe, expect, it } from "vitest";
import { FEEDBACK_STATEMENTS } from "./constants/feedback-statements";
import { hasAnsweredToday, pickFeedbackStatement, type FeedbackAnswer } from "./feedback-cards";

const NOW = new Date(2026, 9, 21, 15, 0);
const YESTERDAY = new Date(2026, 9, 20, 23, 30).getTime();
const EARLIER_TODAY = new Date(2026, 9, 21, 0, 5).getTime();

const answered = (statementKey: string, votedAt = YESTERDAY): FeedbackAnswer => ({ statementKey, votedAt });
const setKeys = (set: 1 | 2) => FEEDBACK_STATEMENTS.filter((s) => s.set === set).map((s) => s.key);

describe("hasAnsweredToday", () => {
  it("is true for an answer earlier the same local day", () => {
    expect(hasAnsweredToday([answered("enjoying", EARLIER_TODAY)], NOW)).toBe(true);
  });

  it("is false for an answer yesterday", () => {
    expect(hasAnsweredToday([answered("enjoying", YESTERDAY)], NOW)).toBe(false);
  });
});

describe("pickFeedbackStatement", () => {
  it("returns null after an answer earlier today", () => {
    expect(pickFeedbackStatement([answered("enjoying", EARLIER_TODAY)], "u1", "r1", NOW)).toBeNull();
  });

  it("offers a card again the next day", () => {
    expect(pickFeedbackStatement([answered("enjoying", YESTERDAY)], "u1", "r1", NOW)).not.toBeNull();
  });

  it("picks from Set 1 while any of it is unanswered", () => {
    const [remainingKey, ...otherSet1Keys] = setKeys(1);
    const pick = pickFeedbackStatement(otherSet1Keys.map((key) => answered(key)), "u1", "r1", NOW);
    expect(pick?.key).toBe(remainingKey);
  });

  it("moves to Set 2 once Set 1 is done", () => {
    const pick = pickFeedbackStatement(setKeys(1).map((key) => answered(key)), "u1", "r1", NOW);
    expect(setKeys(2)).toContain(pick?.key);
  });

  it("never returns an answered statement", () => {
    const answers = [answered("founder_chat"), answered("enjoying")];
    for (let i = 0; i < 50; i++) {
      const pick = pickFeedbackStatement(answers, "u1", `room-${i}`, NOW);
      expect(["founder_chat", "enjoying"]).not.toContain(pick?.key);
    }
  });

  it("gives the same pick for the same user and room", () => {
    const first = pickFeedbackStatement([], "u1", "r1", NOW);
    const second = pickFeedbackStatement([], "u1", "r1", NOW);
    expect(second).toEqual(first);
  });

  it("spreads picks across Set 1 for different rooms", () => {
    const picks = new Set(
      Array.from({ length: 50 }, (_, i) => pickFeedbackStatement([], "u1", `room-${i}`, NOW)?.key),
    );
    expect(picks).toEqual(new Set(setKeys(1)));
  });

  it("returns null once all statements are answered", () => {
    expect(pickFeedbackStatement(FEEDBACK_STATEMENTS.map((s) => answered(s.key)), "u1", "r1", NOW)).toBeNull();
  });
});
