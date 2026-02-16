import { getUser } from "./kv-utils.tsx";

export async function validateDeveloper(c: any, next: any) {
  const userId = c.get("userId");
  
  if (!userId) {
    return c.json({ error: "Unauthorized - No session" }, 401);
  }

  const user = await getUser(userId);
  if (!user || !user.isDeveloper) {
    return c.json({ error: "Forbidden - Developer access required" }, 403);
  }

  await next();
}
