import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { defineRoute } from "./route-wrapper.tsx";
import { RouteError } from "./route-error.ts";

const fakeContext = (body: Record<string, unknown>) => ({
  req: {
    method: "POST",
    param: () => ({}),
    query: () => ({}),
    json: () => Promise.resolve(body),
  },
  json: (payload: unknown, status = 200) => ({ payload, status }),
});

const fakeGetContext = (query: Record<string, string>, path: Record<string, string> = {}) => ({
  req: {
    method: "GET",
    param: () => path,
    query: () => query,
    json: () => Promise.reject(new Error("GET has no body")),
  },
  json: (payload: unknown, status = 200) => ({ payload, status }),
});

const runGet = (route: ReturnType<typeof defineRoute>, query: Record<string, string>, path?: Record<string, string>) =>
  route(fakeGetContext(query, path) as never) as unknown as Promise<{ payload: any; status: number }>;

const run = (route: ReturnType<typeof defineRoute>, body: Record<string, unknown> = {}) =>
  route(fakeContext(body) as never) as unknown as Promise<{ payload: any; status: number }>;

Deno.test("defineRoute - a RouteError keeps its status and message", async () => {
  const route = defineRoute({}, () => Promise.reject(new RouteError("Nope", 403)), "Failed");
  const { payload, status } = await run(route);
  assertEquals(status, 403);
  assertEquals(payload.error, "Nope");
});

Deno.test("defineRoute - any other error is a 500", async () => {
  const route = defineRoute({}, () => Promise.reject(new Error("Boom")), "Failed");
  assertEquals((await run(route)).status, 500);
});

Deno.test("defineRoute - an array param passes an array type check", async () => {
  const route = defineRoute(
    { ids: { type: "array", required: true } },
    ({ ids }: { ids: string[] }) => Promise.resolve({ count: ids.length }),
    "Failed",
  );
  const { payload, status } = await run(route, { ids: ["a", "b"] });
  assertEquals(status, 200);
  assertEquals(payload.count, 2);
});

Deno.test("defineRoute - an object is not accepted as an array", async () => {
  const route = defineRoute(
    { ids: { type: "array", required: true } },
    () => Promise.resolve({}),
    "Failed",
  );
  assertEquals((await run(route, { ids: { a: 1 } })).status, 400);
});

Deno.test("defineRoute - a GET reads and validates query params", async () => {
  const route = defineRoute(
    { screen: { type: "string", required: false, validate: (val) => val === "lobby" } },
    ({ screen }: { screen?: string }) => Promise.resolve({ screen }),
    "Failed",
  );
  assertEquals((await runGet(route, { screen: "lobby" })).payload.screen, "lobby");
  assertEquals((await runGet(route, { screen: "dancing" })).status, 400);
  assertEquals((await runGet(route, {})).payload.screen, undefined);
});

Deno.test("defineRoute - a path param wins over a query param with the same name", async () => {
  const route = defineRoute(
    { eventId: { type: "string", required: true } },
    ({ eventId }: { eventId: string }) => Promise.resolve({ eventId }),
    "Failed",
  );
  assertEquals((await runGet(route, { eventId: "9" }, { eventId: "4" })).payload.eventId, "4");
});
