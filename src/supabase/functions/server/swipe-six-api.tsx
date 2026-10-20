import { Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import {
  buildRoomSwipeSixForUser,
  buildSwipeSixForUser,
  getSwipeSixCompletion,
  saveSwipeSixCompletion,
} from "./swipe-six-model.ts";

const app = new Hono();

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const localDateParam = {
  type: "string" as const,
  required: true,
  validate: (value: string) => LOCAL_DATE_PATTERN.test(value),
  errorMessage: "localDate must be YYYY-MM-DD",
};

app.get(
  `${API_URL_PREFIX}/swipe-six`,
  defineRoute(
    {},
    async (_params, c) => {
      const userId = c.get("userId");
      return { items: await buildSwipeSixForUser(userId) };
    },
    "Failed to build swipe six",
  ),
);

app.get(
  `${API_URL_PREFIX}/swipe-six/room/:roomId`,
  defineRoute(
    { roomId: { type: "string", required: true } },
    async ({ roomId }: { roomId: string }, c) => {
      const userId = c.get("userId");
      return { items: await buildRoomSwipeSixForUser(userId, roomId) };
    },
    "Failed to build room swipe six",
  ),
);

app.get(
  `${API_URL_PREFIX}/swipe-six/status/:localDate`,
  defineRoute(
    { localDate: localDateParam },
    async ({ localDate }: { localDate: string }, c) => {
      const userId = c.get("userId");
      const completion = await getSwipeSixCompletion(userId, localDate);
      return { completedToday: completion !== null };
    },
    "Failed to get swipe six status",
  ),
);

app.post(
  `${API_URL_PREFIX}/swipe-six/complete`,
  defineRoute(
    { localDate: localDateParam },
    async ({ localDate }: { localDate: string }, c) => {
      const userId = c.get("userId");
      await saveSwipeSixCompletion({ userId, localDate, completedAt: Date.now() });
      return {};
    },
    "Failed to complete swipe six",
  ),
);

export { app as swipeSixApi };
