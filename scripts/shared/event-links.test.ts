import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildEventLinks } from "./event-links.ts";

Deno.test("buildEventLinks - every link points at a real page", () => {
  assertEquals(buildEventLinks("16", "abc"), {
    eventPage: "https://heard.vote/event/16",
    display: "https://heard.vote/event/16/display?key=abc",
    approval: "https://heard.vote/event/16/approve?key=abc",
    phone: "https://heard.vote/event/16/live",
  });
});

Deno.test("buildEventLinks - no display or approval link without a display key", () => {
  const links = buildEventLinks("16", null);
  assertEquals(links.display, null);
  assertEquals(links.approval, null);
});
