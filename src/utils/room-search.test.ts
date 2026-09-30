import { describe, it, expect } from "vitest";
import { topicMatchesSearch } from "./room-search";

describe("topicMatchesSearch", () => {
  const topic = "Should Connecticut Ave get protected bike lanes?";

  it("matches a substring regardless of case", () => {
    expect(topicMatchesSearch(topic, "bike lanes")).toBe(true);
    expect(topicMatchesSearch(topic, "CONNECTICUT")).toBe(true);
  });

  it("does not match letters that only appear out of order", () => {
    expect(topicMatchesSearch(topic, "bklns")).toBe(false);
    expect(topicMatchesSearch(topic, "lanes bike")).toBe(false);
  });

  it("matches everything for an empty or blank search", () => {
    expect(topicMatchesSearch(topic, "")).toBe(true);
    expect(topicMatchesSearch(topic, "   ")).toBe(true);
  });

  it("ignores surrounding whitespace in the search", () => {
    expect(topicMatchesSearch(topic, "  protected ")).toBe(true);
  });
});
