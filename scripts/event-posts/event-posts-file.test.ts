import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { EventPostsFileError, parseEventPostsFile } from "./event-posts-file.ts";

Deno.test("parseEventPostsFile reads posts in order and trims text", () => {
  const drafts = parseEventPostsFile(JSON.stringify([
    { topic: "  First question here?  ", statements: [" One. ", "Two."] },
    { topic: "Second question here?", statements: ["Three."] },
  ]));
  assertEquals(drafts, [
    { topic: "First question here?", statements: ["One.", "Two."] },
    { topic: "Second question here?", statements: ["Three."] },
  ]);
});

Deno.test("parseEventPostsFile refuses invalid JSON", () => {
  assertThrows(() => parseEventPostsFile("[{"), EventPostsFileError, "isn't valid JSON");
});

Deno.test("parseEventPostsFile refuses an empty list", () => {
  assertThrows(() => parseEventPostsFile("[]"), EventPostsFileError, "at least one post");
});

Deno.test("parseEventPostsFile names the post with a short topic", () => {
  assertThrows(
    () => parseEventPostsFile(JSON.stringify([{ topic: "Long enough?", statements: ["A."] }, { topic: "Hi", statements: ["B."] }])),
    EventPostsFileError,
    "Post 2's topic",
  );
});

Deno.test("parseEventPostsFile refuses a post without statements", () => {
  assertThrows(
    () => parseEventPostsFile(JSON.stringify([{ topic: "Long enough?", statements: [] }])),
    EventPostsFileError,
    "Post 1 needs",
  );
});

Deno.test("parseEventPostsFile names a blank or overlong statement", () => {
  assertThrows(
    () => parseEventPostsFile(JSON.stringify([{ topic: "Long enough?", statements: ["Fine.", "  "] }])),
    EventPostsFileError,
    "Post 1, statement 2",
  );
  assertThrows(
    () => parseEventPostsFile(JSON.stringify([{ topic: "Long enough?", statements: ["x".repeat(501)] }])),
    EventPostsFileError,
    "Post 1, statement 1",
  );
});
