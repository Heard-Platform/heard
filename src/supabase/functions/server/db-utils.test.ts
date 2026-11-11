import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  fetchAllPagesAfterKey,
  MAXIMUM_KEY_PREFIXES_PER_QUERY,
  splitKeyPrefixesIntoBatches,
} from "./db-utils.ts";

const PAGE_SIZE = 2;

const row = (key: string) => ({ key });

const servePages = (pages: { key: string }[][]) => {
  const requestedAfterKeys: (string | null)[] = [];
  const queryPage = (afterKey: string | null) => {
    requestedAfterKeys.push(afterKey);
    const page = pages[requestedAfterKeys.length - 1] ?? [];
    return Promise.resolve({ data: page, error: null });
  };
  return { queryPage, requestedAfterKeys };
};

Deno.test("fetchAllPagesAfterKey - stops after a short page", async () => {
  const { queryPage, requestedAfterKeys } = servePages([
    [row("a"), row("b")],
    [row("c")],
  ]);
  const rows = await fetchAllPagesAfterKey(queryPage, PAGE_SIZE);
  assertEquals(rows.map((fetched) => fetched.key), ["a", "b", "c"]);
  assertEquals(requestedAfterKeys, [null, "b"]);
});

Deno.test("fetchAllPagesAfterKey - asks once more after a full last page", async () => {
  const { queryPage, requestedAfterKeys } = servePages([
    [row("a"), row("b")],
  ]);
  const rows = await fetchAllPagesAfterKey(queryPage, PAGE_SIZE);
  assertEquals(rows.length, 2);
  assertEquals(requestedAfterKeys, [null, "b"]);
});

Deno.test("fetchAllPagesAfterKey - fails on a query error", async () => {
  const queryPage = () =>
    Promise.resolve({ data: null, error: { message: "boom" } });
  await assertRejects(
    () => fetchAllPagesAfterKey(queryPage, PAGE_SIZE),
    Error,
    "boom",
  );
});

Deno.test("splitKeyPrefixesIntoBatches - caps each batch", () => {
  const prefixes = Array.from(
    { length: MAXIMUM_KEY_PREFIXES_PER_QUERY * 2 + 1 },
    (_, index) => `vote:${index}:`,
  );
  const batchSizes = splitKeyPrefixesIntoBatches(prefixes).map(
    (batch) => batch.length,
  );
  assertEquals(batchSizes, [
    MAXIMUM_KEY_PREFIXES_PER_QUERY,
    MAXIMUM_KEY_PREFIXES_PER_QUERY,
    1,
  ]);
});

Deno.test("splitKeyPrefixesIntoBatches - no batches for no prefixes", () => {
  assertEquals(splitKeyPrefixesIntoBatches([]), []);
});
