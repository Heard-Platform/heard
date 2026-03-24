import { Context, Hono } from "npm:hono";
import { validateSession } from "./auth-utils.ts";
import { defineRoute } from "./route-wrapper.tsx";
import { VALID_AVATARS } from "./constants.tsx";
import { getUser, saveUser } from "./kv-utils.tsx";
import { AvatarAnimal, UserPresence } from "./types.tsx";
import { sanitizeUser } from "./user-utils.ts";
import { selectAll, upsert } from "./db-utils.ts";

const accountApp = new Hono();

accountApp.post(
  "/make-server-f1a393b4/account/avatar",
  defineRoute(
    {
      avatarAnimal: {
        type: "string",
        required: true,
        validate: (val) => VALID_AVATARS.includes(val),
        errorMessage: "Invalid avatar animal",
      },
    },
    async ({ avatarAnimal }: { avatarAnimal: AvatarAnimal }, c: Context) => {
      const userId = c.get("userId");
      const user = (await getUser(userId))!;

      if (user.isAnonymous) {
        throw new Error("Logged-in account required to change avatar");
      }

      user.avatarAnimal = avatarAnimal;
      await saveUser(user);

      const presence = await selectAll<UserPresence>("presences", {
        userId,
      });

      if (presence.length > 0) {
        await upsert("presences", { userId, avatarAnimal }, "userId");
      }

      return { user: sanitizeUser(user) };
    },
    "Failed to update avatar",
  ),
);

export { accountApp as accountApi };
