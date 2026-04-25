import { describe, it, expect } from "vitest";
import { isValidCachedUser } from "./cache-utils";
import type { UserSession } from "../types";

const validUser: UserSession = {
  id: "user-1",
  nickname: "Alex",
  email: "alex@example.com",
  score: 42,
  streak: 3,
  lastActive: 1700000000000,
  createdAt: 1700000000000,
};

describe("isValidCachedUser", () => {
  it("returns true for a minimal valid user (no optional fields)", () => {
    expect(isValidCachedUser(validUser)).toBe(true);
  });

  it("returns true for a user with all optional fields populated", () => {
    const full: UserSession = {
      ...validUser,
      phoneSuffix: "1234",
      currentRoomId: "room-abc",
      isTestUser: false,
      isDeveloper: true,
      isAnonymous: false,
      isUnsubbedFromUpdates: false,
      phoneVerified: true,
      flyerId: "flyer-xyz",
      convertedFromAnonAt: 1700000001000,
      createdInEnvironment: "production",
      avatarAnimal: "koala",
    };
    expect(isValidCachedUser(full)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidCachedUser(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidCachedUser(undefined)).toBe(false);
  });

  it("returns false for a primitive", () => {
    expect(isValidCachedUser("not a user")).toBe(false);
    expect(isValidCachedUser(42)).toBe(false);
    expect(isValidCachedUser(true)).toBe(false);
  });

  it("returns false when a required field is missing", () => {
    const { score: _omitted, ...withoutScore } = validUser;
    expect(isValidCachedUser(withoutScore)).toBe(false);
  });

  it("returns false when a required field has the wrong type", () => {
    expect(isValidCachedUser({ ...validUser, score: "42" })).toBe(false);
    expect(isValidCachedUser({ ...validUser, id: 1 })).toBe(false);
    expect(isValidCachedUser({ ...validUser, createdAt: "yesterday" })).toBe(
      false,
    );
  });

  it("returns false for an invalid avatar value", () => {
    expect(
      isValidCachedUser({ ...validUser, avatarAnimal: "dinosaur" }),
    ).toBe(false);
  });

  it("accepts extra unknown fields (forward compatibility)", () => {
    expect(
      isValidCachedUser({ ...validUser, someFutureField: "foo" }),
    ).toBe(true);
  });
});
