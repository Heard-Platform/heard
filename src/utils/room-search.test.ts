import { describe, it, expect } from "vitest";
import { toRoomSearchOption, topicMatchesSearch } from "./room-search";

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

describe("toRoomSearchOption", () => {
  it("keeps the room id and topic and shows the vote count in the detail", () => {
    const option = toRoomSearchOption({
      roomId: "room-1",
      topic: "Should DC allow Waymo?",
      voteCount: 1234,
      createdAt: Date.UTC(2026, 9, 1, 12),
    });
    expect(option.id).toBe("room-1");
    expect(option.topic).toBe("Should DC allow Waymo?");
    expect(option.detail).toContain("1,234 votes");
  });
});
