import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import { buildDuplicateEmailAlertHtml } from "./duplicate-email-alert.ts";
import type { User } from "./types.tsx";

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  nickname: "nick",
  email: "",
  score: 0,
  streak: 0,
  lastActive: 0,
  emailDigestsEnabled: true,
  createdAt: 0,
  ...overrides,
});

describe("buildDuplicateEmailAlertHtml", () => {
  it("includes both accounts, the attempted email and the phone suffix", () => {
    const html = buildDuplicateEmailAlertHtml(
      makeUser({ id: "phone-user", phoneNumber: "+15551234567" }),
      makeUser({ id: "existing-user", nickname: "existing", email: "taken@example.com" }),
      "taken@example.com",
      0,
    );

    assertStringIncludes(html, "phone-user");
    assertStringIncludes(html, "existing-user");
    assertStringIncludes(html, "taken@example.com");
    assertStringIncludes(html, "4567");
    assertEquals(html.includes("+15551234567"), false);
  });

  it("escapes user-controlled values", () => {
    const html = buildDuplicateEmailAlertHtml(
      makeUser({ nickname: "<script>alert(1)</script>" }),
      makeUser({ id: "existing-user" }),
      "a@example.com",
      0,
    );

    assertEquals(html.includes("<script>"), false);
    assertStringIncludes(html, "&lt;script&gt;");
  });

  it("handles a missing attempting user", () => {
    const html = buildDuplicateEmailAlertHtml(null, makeUser({ id: "existing-user" }), "a@example.com", 0);
    assertStringIncludes(html, "unknown");
  });
});
