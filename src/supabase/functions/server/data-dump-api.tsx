import { Context, Hono, Next } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { insertDataDump } from "./model-utils.ts";
import { getLastDataDumpAt, setLastDataDumpAt } from "./kv-utils.tsx";

export const dataDumpApi = new Hono();

const MAX_KIND_CHARS = 100;
const MAX_PAYLOAD_CHARS = 10_000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const limitToOncePerMinute = async (c: Context, next: Next) => {
  const now = Date.now();
  const lastDumpedAt = await getLastDataDumpAt();

  if (lastDumpedAt !== null && now - lastDumpedAt < RATE_LIMIT_WINDOW_MS) {
    console.warn("Data dump rejected: rate limited");
    return c.json({ error: "Too many requests" }, 429);
  }

  await setLastDataDumpAt(now);
  await next();
};

const isWithinSizeCap = (payload: Record<string, unknown>) =>
  JSON.stringify(payload).length <= MAX_PAYLOAD_CHARS;

dataDumpApi.post(
  "/make-server-f1a393b4/data-dump",
  limitToOncePerMinute,
  defineRoute(
    {
      kind: {
        type: "string",
        required: true,
        validate: (kind: string) => kind.length <= MAX_KIND_CHARS,
        errorMessage: `kind must be a string of at most ${MAX_KIND_CHARS} characters`,
      },
      payload: {
        type: "object",
        required: true,
        validate: isWithinSizeCap,
        errorMessage: `payload must be an object of at most ${MAX_PAYLOAD_CHARS} characters`,
      },
    },
    async ({ kind, payload }: { kind: string; payload: Record<string, unknown> }) => {
      const result = await insertDataDump(kind, payload);
      if (!result.success) {
        throw new Error(result.error);
      }
      return {};
    },
    "Failed to save data dump",
  ),
);
