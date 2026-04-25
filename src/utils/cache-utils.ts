import type { UserSession } from "../types";
import {
  AvatarAnimal,
  AVATAR_OPTIONS,
} from "./constants/avatars";

type FieldValidator<T> = (value: unknown) => value is T;

// Per-field validators for UserSession.
// The `-?` modifier forces every key to be present in this map, including optional
// ones, so adding a new field to UserSession without a matching validator is a
// compile error — the map literal below will be flagged for the missing key.
const USER_SESSION_FIELD_VALIDATORS: {
  [K in keyof UserSession]-?: FieldValidator<UserSession[K]>;
} = {
  id: (v): v is string => typeof v === "string",
  nickname: (v): v is string => typeof v === "string",
  email: (v): v is string => typeof v === "string",
  phoneSuffix: (v): v is string | undefined =>
    v === undefined || typeof v === "string",
  score: (v): v is number => typeof v === "number",
  streak: (v): v is number => typeof v === "number",
  currentRoomId: (v): v is string | undefined =>
    v === undefined || typeof v === "string",
  lastActive: (v): v is number => typeof v === "number",
  isTestUser: (v): v is boolean | undefined =>
    v === undefined || typeof v === "boolean",
  isDeveloper: (v): v is boolean | undefined =>
    v === undefined || typeof v === "boolean",
  createdAt: (v): v is number => typeof v === "number",
  isAnonymous: (v): v is boolean | undefined =>
    v === undefined || typeof v === "boolean",
  isUnsubbedFromUpdates: (v): v is boolean | undefined =>
    v === undefined || typeof v === "boolean",
  phoneVerified: (v): v is boolean | undefined =>
    v === undefined || typeof v === "boolean",
  flyerId: (v): v is string | undefined =>
    v === undefined || typeof v === "string",
  convertedFromAnonAt: (v): v is number | undefined =>
    v === undefined || typeof v === "number",
  createdInEnvironment: (v): v is string | undefined =>
    v === undefined || typeof v === "string",
  avatarAnimal: (v): v is AvatarAnimal | undefined =>
    v === undefined || AVATAR_OPTIONS.some((opt) => opt.value === v),
};

export function isValidCachedUser(obj: unknown): obj is UserSession {
  // No cached user yet (first visit, after logout, etc.) — expected, not a problem.
  if (obj === null || obj === undefined) return false;

  if (typeof obj !== "object") {
    console.warn("[cache] Cached user invalid: not an object", { obj });
    return false;
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(USER_SESSION_FIELD_VALIDATORS) as Array<
    keyof UserSession
  >) {
    const validator = USER_SESSION_FIELD_VALIDATORS[key] as FieldValidator<
      unknown
    >;
    if (!validator(record[key])) {
      console.warn(
        `[cache] Cached user failed validation: field "${key}" is invalid`,
        { value: record[key] },
      );
      return false;
    }
  }
  return true;
}
