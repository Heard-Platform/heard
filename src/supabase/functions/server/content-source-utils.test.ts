import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getContentSource } from "./content-source-utils.ts";

Deno.test("getContentSource - from the event is event", () => {
  assertEquals(getContentSource(true), "event");
});

Deno.test("getContentSource - not from the event is feed", () => {
  assertEquals(getContentSource(false), "feed");
});
