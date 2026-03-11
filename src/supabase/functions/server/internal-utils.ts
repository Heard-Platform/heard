import { getUser } from "./kv-utils.tsx";
import { validateSession } from "./auth-utils.ts";

export async function validateDeveloper(c: any, next: any) {
  return validateSession(c, async () => {
    const userId = c.get("userId");
    const user = await getUser(userId);
    if (!user || !user.isDeveloper) {
      return c.json({ error: "Forbidden - Developer access required" }, 403);
    }
    await next();
  });
}
