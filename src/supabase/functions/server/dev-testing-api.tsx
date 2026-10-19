import { Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { buildSwipeSixForUser } from "./swipe-six-model.ts";

// Routes behind the dev tools Testing tab.
const app = new Hono();

app.get(
  `${API_URL_PREFIX}/dev/swipe-six`,
  defineRoute(
    {},
    async (_params, c) => {
      return { items: await buildSwipeSixForUser(c.get("userId")) };
    },
    "Failed to build swipe six",
  ),
);

export { app as devTestingApi };
