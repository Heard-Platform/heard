import { Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { getDebate, getAllDebates } from "./kv-utils.tsx";
import { getFlyerScans } from "./model-utils.ts";
import { API_URL_PREFIX } from "./constants.tsx";

const app = new Hono();

const PREFIX = `${API_URL_PREFIX}/performance-test`;

// Control: no-op, measures raw round-trip latency
app.get(
  `${PREFIX}/ping`,
  defineRoute({}, async () => ({ message: "pong" }), "Error in ping"),
);

// Replace with a real room ID before testing
const PLACEHOLDER_ROOM_ID = "43rmfvxw9wjmoaizr4y";

// KV single: fetch one room by ID
app.get(
  `${PREFIX}/kv-single`,
  defineRoute(
    {},
    async () => {
      const room = await getDebate(PLACEHOLDER_ROOM_ID);
      return { found: !!room };
    },
    "Error fetching single room from KV",
  ),
);

// SQL table: fetch flyer_scans (regular Postgres table)
app.get(
  `${PREFIX}/sql-table`,
  defineRoute(
    {},
    async () => {
      const scans = await getFlyerScans();
      return { count: scans.length };
    },
    "Error fetching flyer scans from SQL",
  ),
);

// KV all: fetch every room (expensive KV scan)
app.get(
  `${PREFIX}/kv-all`,
  defineRoute(
    {},
    async () => {
      const rooms = await getAllDebates();
      return { count: rooms.length };
    },
    "Error fetching all rooms from KV",
  ),
);

export { app as performanceTestApi };
