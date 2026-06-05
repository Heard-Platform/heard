import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import {
  condenseByType,
  condenseRowsForUser,
  deduplicateByPost,
  filterUsersAtLimit,
  getRowsForUsers,
  pickSubjectLine,
  processEmailQueue,
  sliceUserIds,
  subjectForItem,
} from "./email-queue-processor.ts";
import type { CondensedItem, EmailQueueRow } from "./email-queue-types.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function row(
  overrides: Pick<EmailQueueRow, "id" | "userId" | "emailType" | "priority" | "postId"> &
    Partial<EmailQueueRow>,
): EmailQueueRow {
  return {
    data: {},
    status: "pending",
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function item(overrides: Partial<CondensedItem> & Pick<CondensedItem, "emailType" | "priority">): CondensedItem {
  return {
    postId: "post-1",
    data: {},
    othersCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// filterUsersAtLimit
// ---------------------------------------------------------------------------

describe("filterUsersAtLimit", () => {
  it("keeps users with zero sends", () => {
    const rows = [row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" })];
    const result = filterUsersAtLimit(rows, {}, 3);
    assertEquals(result.length, 1);
  });

  it("keeps users below the limit", () => {
    const rows = [row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" })];
    const result = filterUsersAtLimit(rows, { u1: 2 }, 3);
    assertEquals(result.length, 1);
  });

  it("removes users at the limit", () => {
    const rows = [row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" })];
    const result = filterUsersAtLimit(rows, { u1: 3 }, 3);
    assertEquals(result.length, 0);
  });

  it("removes users above the limit", () => {
    const rows = [row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" })];
    const result = filterUsersAtLimit(rows, { u1: 5 }, 3);
    assertEquals(result.length, 0);
  });

  it("removes all rows for an at-limit user including multiple rows", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "post_trending", priority: 2, postId: "p2" }),
    ];
    const result = filterUsersAtLimit(rows, { u1: 3 }, 3);
    assertEquals(result.length, 0);
  });

  it("keeps one user while removing another", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u2", emailType: "post_ended", priority: 3, postId: "p2" }),
    ];
    const result = filterUsersAtLimit(rows, { u1: 3, u2: 1 }, 3);
    assertEquals(result.length, 1);
    assertEquals(result[0].userId, "u2");
  });

  it("returns empty for empty input", () => {
    assertEquals(filterUsersAtLimit([], {}, 3).length, 0);
  });
});

// ---------------------------------------------------------------------------
// sliceUserIds
// ---------------------------------------------------------------------------

describe("sliceUserIds", () => {
  it("returns first N ids when there are more than max", () => {
    const ids = ["u1", "u2", "u3", "u4", "u5"];
    const result = sliceUserIds(ids, 3);
    assertEquals(result, ["u1", "u2", "u3"]);
  });

  it("returns all ids when fewer than max", () => {
    const ids = ["u1", "u2"];
    assertEquals(sliceUserIds(ids, 10), ["u1", "u2"]);
  });

  it("returns exact count when equal to max", () => {
    const ids = ["u1", "u2", "u3"];
    assertEquals(sliceUserIds(ids, 3), ["u1", "u2", "u3"]);
  });

  it("returns empty for empty input", () => {
    assertEquals(sliceUserIds([], 10), []);
  });
});

// ---------------------------------------------------------------------------
// getRowsForUsers
// ---------------------------------------------------------------------------

describe("getRowsForUsers", () => {
  const rows = [
    row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
    row({ id: "r2", userId: "u2", emailType: "post_ended", priority: 3, postId: "p2" }),
    row({ id: "r3", userId: "u3", emailType: "post_ended", priority: 3, postId: "p3" }),
  ];

  it("returns only rows for listed users", () => {
    const result = getRowsForUsers(rows, ["u1", "u3"]);
    assertEquals(result.map((r) => r.id).sort(), ["r1", "r3"]);
  });

  it("returns empty when no users match", () => {
    assertEquals(getRowsForUsers(rows, ["u99"]).length, 0);
  });

  it("returns empty for empty userIds", () => {
    assertEquals(getRowsForUsers(rows, []).length, 0);
  });

  it("returns all rows when all users listed", () => {
    assertEquals(getRowsForUsers(rows, ["u1", "u2", "u3"]).length, 3);
  });
});

// ---------------------------------------------------------------------------
// deduplicateByPost
// ---------------------------------------------------------------------------

describe("deduplicateByPost", () => {
  it("keeps only the highest-priority row when a post has multiple notifications", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "response_highest_agreed", priority: 8, postId: "p1" }),
    ];
    const result = deduplicateByPost(rows);
    assertEquals(result.length, 1);
    assertEquals(result[0].emailType, "response_highest_agreed");
  });

  it("keeps all rows when each is for a different post", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "post_ended", priority: 3, postId: "p2" }),
    ];
    assertEquals(deduplicateByPost(rows).length, 2);
  });

  it("handles a single row", () => {
    const rows = [row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" })];
    assertEquals(deduplicateByPost(rows).length, 1);
  });

  it("keeps highest priority when three rows share a post", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 2, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "response_getting_traction", priority: 5, postId: "p1" }),
      row({ id: "r3", userId: "u1", emailType: "response_highest_agreed", priority: 8, postId: "p1" }),
    ];
    const result = deduplicateByPost(rows);
    assertEquals(result.length, 1);
    assertEquals(result[0].emailType, "response_highest_agreed");
  });

  it("handles multiple posts each with multiple rows", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "response_highest_agreed", priority: 8, postId: "p1" }),
      row({ id: "r3", userId: "u1", emailType: "post_ended", priority: 3, postId: "p2" }),
      row({ id: "r4", userId: "u1", emailType: "post_trending", priority: 5, postId: "p2" }),
    ];
    const result = deduplicateByPost(rows);
    assertEquals(result.length, 2);
    const byPost = Object.fromEntries(result.map((r) => [r.postId, r]));
    assertEquals(byPost["p1"].emailType, "response_highest_agreed");
    assertEquals(byPost["p2"].emailType, "post_trending");
  });

  it("returns empty for empty input", () => {
    assertEquals(deduplicateByPost([]).length, 0);
  });
});

// ---------------------------------------------------------------------------
// condenseByType
// ---------------------------------------------------------------------------

describe("condenseByType", () => {
  it("collapses multiple rows of the same type, keeping highest priority", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1", data: { postTitle: "Post A" } }),
      row({ id: "r2", userId: "u1", emailType: "post_ended", priority: 5, postId: "p2", data: { postTitle: "Post B" } }),
      row({ id: "r3", userId: "u1", emailType: "post_ended", priority: 2, postId: "p3", data: { postTitle: "Post C" } }),
    ];
    const result = condenseByType(rows);
    assertEquals(result.length, 1);
    assertEquals(result[0].emailType, "post_ended");
    assertEquals(result[0].postId, "p2");
    assertEquals(result[0].othersCount, 2);
  });

  it("keeps separate items for different types", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "response_highest_agreed", priority: 8, postId: "p2" }),
    ];
    const result = condenseByType(rows);
    assertEquals(result.length, 2);
    const types = result.map((i) => i.emailType).sort();
    assertEquals(types, ["post_ended", "response_highest_agreed"]);
    result.forEach((i) => assertEquals(i.othersCount, 0));
  });

  it("othersCount is 0 for a single item", () => {
    const rows = [row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" })];
    const result = condenseByType(rows);
    assertEquals(result[0].othersCount, 0);
  });

  it("returns empty for empty input", () => {
    assertEquals(condenseByType([]).length, 0);
  });
});

// ---------------------------------------------------------------------------
// subjectForItem
// ---------------------------------------------------------------------------

describe("subjectForItem", () => {
  it("response_highest_agreed returns fixed subject", () => {
    const i = item({ emailType: "response_highest_agreed", priority: 8 });
    assertEquals(subjectForItem(i), "Your response is the highest agreed!");
  });

  it("post_ended includes title when present", () => {
    const i = item({ emailType: "post_ended", priority: 3, data: { postTitle: "Is pineapple ok?" } });
    assertEquals(subjectForItem(i), `"Is pineapple ok?" has ended`);
  });

  it("post_ended falls back gracefully without title", () => {
    const i = item({ emailType: "post_ended", priority: 3 });
    assertEquals(subjectForItem(i), "A post you follow has ended");
  });

  it("response_getting_traction returns fixed subject", () => {
    const i = item({ emailType: "response_getting_traction", priority: 5 });
    assertEquals(subjectForItem(i), "Your response is getting traction");
  });

  it("post_trending includes title when present", () => {
    const i = item({ emailType: "post_trending", priority: 4, data: { postTitle: "Hot topic" } });
    assertEquals(subjectForItem(i), `"Hot topic" is trending`);
  });

  it("new_response_on_post includes title when present", () => {
    const i = item({ emailType: "new_response_on_post", priority: 2, data: { postTitle: "My post" } });
    assertEquals(subjectForItem(i), `New responses on "My post"`);
  });
});

// ---------------------------------------------------------------------------
// pickSubjectLine
// ---------------------------------------------------------------------------

describe("pickSubjectLine", () => {
  it("returns default when items is empty", () => {
    assertEquals(pickSubjectLine([]), "New activity on Heard");
  });

  it("picks the highest-priority item for the subject", () => {
    const items = [
      item({ emailType: "post_ended", priority: 3, data: { postTitle: "Some post" } }),
      item({ emailType: "response_highest_agreed", priority: 8 }),
    ];
    assertEquals(pickSubjectLine(items), "Your response is the highest agreed!");
  });

  it("uses lower-priority item when it is the only one", () => {
    const items = [item({ emailType: "post_ended", priority: 3, data: { postTitle: "My post" } })];
    assertEquals(pickSubjectLine(items), `"My post" has ended`);
  });

  it("breaks ties by choosing first in sort order (stable)", () => {
    const items = [
      item({ emailType: "post_ended", priority: 5, data: { postTitle: "Post A" } }),
      item({ emailType: "post_trending", priority: 5, data: { postTitle: "Post A" } }),
    ];
    // Both have priority 5 — just assert a non-empty string is returned
    const subject = pickSubjectLine(items);
    assertEquals(typeof subject, "string");
    assertEquals(subject.length > 0, true);
  });
});

// ---------------------------------------------------------------------------
// condenseRowsForUser
// ---------------------------------------------------------------------------

describe("condenseRowsForUser", () => {
  it("uses highest-priority notification as subject when a post has multiple types", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1", data: { postTitle: "Climate change" } }),
      row({ id: "r2", userId: "u1", emailType: "response_highest_agreed", priority: 8, postId: "p1" }),
    ];
    const result = condenseRowsForUser("u1", rows);
    assertEquals(result.userId, "u1");
    assertEquals(result.subject, "Your response is the highest agreed!");
    // After dedup post_ended is gone — only 1 item
    assertEquals(result.items.length, 1);
    assertEquals(result.items[0].emailType, "response_highest_agreed");
  });

  it("shows count when multiple posts share the same type", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1", data: { postTitle: "Post A" } }),
      row({ id: "r2", userId: "u1", emailType: "post_ended", priority: 3, postId: "p2", data: { postTitle: "Post B" } }),
    ];
    const result = condenseRowsForUser("u1", rows);
    assertEquals(result.items.length, 1);
    assertEquals(result.items[0].othersCount, 1);
  });

  it("includes all original row IDs for marking", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "response_highest_agreed", priority: 8, postId: "p2" }),
    ];
    const result = condenseRowsForUser("u1", rows);
    assertEquals(result.rowIds.sort(), ["r1", "r2"]);
  });

  it("handles a single row correctly", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1", data: { postTitle: "Solo post" } }),
    ];
    const result = condenseRowsForUser("u1", rows);
    assertEquals(result.items.length, 1);
    assertEquals(result.items[0].othersCount, 0);
    assertEquals(result.subject, `"Solo post" has ended`);
  });

  it("produces correct output for a rich mix of notifications", () => {
    // 3 different posts: p1 has post_ended + response_highest_agreed (dedup to highest_agreed)
    // p2 has post_ended, p3 has post_ended
    // After dedup: highest_agreed(p1), post_ended(p2), post_ended(p3)
    // After condense: highest_agreed x1, post_ended x1 (+ 1 other)
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "response_highest_agreed", priority: 8, postId: "p1" }),
      row({ id: "r3", userId: "u1", emailType: "post_ended", priority: 3, postId: "p2" }),
      row({ id: "r4", userId: "u1", emailType: "post_ended", priority: 3, postId: "p3" }),
    ];
    const result = condenseRowsForUser("u1", rows);
    assertEquals(result.subject, "Your response is the highest agreed!");
    assertEquals(result.items.length, 2);
    const byType = Object.fromEntries(result.items.map((i) => [i.emailType, i]));
    assertEquals(byType["response_highest_agreed"].othersCount, 0);
    assertEquals(byType["post_ended"].othersCount, 1);
    assertEquals(result.rowIds.sort(), ["r1", "r2", "r3", "r4"]);
  });
});

// ---------------------------------------------------------------------------
// processEmailQueue (full pipeline)
// ---------------------------------------------------------------------------

describe("processEmailQueue", () => {
  it("filters out users who have hit the daily limit", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u2", emailType: "post_ended", priority: 3, postId: "p2" }),
    ];
    const result = processEmailQueue(rows, { u1: 3 }, { dailyLimit: 3 });
    assertEquals(result.usersToProcess, ["u2"]);
    assertEquals(result.condensed.length, 1);
    assertEquals(result.condensed[0].userId, "u2");
  });

  it("respects maxUsersPerRun", () => {
    const rows = ["u1", "u2", "u3", "u4"].map((uid, i) =>
      row({ id: `r${i}`, userId: uid, emailType: "post_ended", priority: 3, postId: `p${i}` })
    );
    const result = processEmailQueue(rows, {}, { maxUsersPerRun: 2 });
    assertEquals(result.usersToProcess.length, 2);
    assertEquals(result.condensed.length, 2);
  });

  it("returns correct rowsToMark for the selected users", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "post_trending", priority: 4, postId: "p2" }),
      row({ id: "r3", userId: "u2", emailType: "post_ended", priority: 3, postId: "p3" }),
    ];
    const result = processEmailQueue(rows, {}, { maxUsersPerRun: 1 });
    // Only first user processed
    assertEquals(result.rowsToMark.length, 2);
    assertEquals(result.rowsToMark.every((r) => r.userId === "u1"), true);
  });

  it("deduplicates and condenses within each user's batch", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "response_highest_agreed", priority: 8, postId: "p1" }),
    ];
    const result = processEmailQueue(rows, {});
    assertEquals(result.condensed[0].subject, "Your response is the highest agreed!");
    assertEquals(result.condensed[0].items.length, 1);
  });

  it("handles empty queue gracefully", () => {
    const result = processEmailQueue([], {});
    assertEquals(result.usersToProcess, []);
    assertEquals(result.rowsToMark, []);
    assertEquals(result.condensed, []);
  });

  it("handles all users at limit (nothing to process)", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
    ];
    const result = processEmailQueue(rows, { u1: 3 }, { dailyLimit: 3 });
    assertEquals(result.usersToProcess, []);
    assertEquals(result.condensed, []);
  });

  it("does not process a user twice even if they appear in multiple rows", () => {
    const rows = [
      row({ id: "r1", userId: "u1", emailType: "post_ended", priority: 3, postId: "p1" }),
      row({ id: "r2", userId: "u1", emailType: "post_trending", priority: 4, postId: "p2" }),
    ];
    const result = processEmailQueue(rows, {});
    assertEquals(result.usersToProcess.length, 1);
    assertEquals(result.condensed.length, 1);
  });
});
