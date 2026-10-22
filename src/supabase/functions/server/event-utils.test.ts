import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseEventId } from "./event-utils.ts";
import { RouteError } from "./route-error.ts";

Deno.test("parseEventId - reads a numeric event ID", () => {
  assertEquals(parseEventId("42"), 42);
});

Deno.test("parseEventId - refuses a missing, empty or non-numeric ID with a 400", () => {
  for (const bad of [undefined, "", "abc", "4.5"]) {
    const error = assertThrows(() => parseEventId(bad), RouteError);
    assertEquals(error.status, 400);
  }
});
