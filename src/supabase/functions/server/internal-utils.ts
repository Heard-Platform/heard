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

export async function validateAdmin(c: any, next: any) {
  const adminKey = c.req.header("X-Admin-Key");
  const validKey = Deno.env.get("DEV_ADMIN_KEY");

  if (!adminKey || !validKey || adminKey !== validKey) {
    return c.json(
      { error: "Unauthorized - Invalid admin key" },
      401,
    );
  }

  await next();
}

export async function validateCronAuth(c: any, next: any) {
  const headerSecret = c.req.header("x-cron-secret");
  const cronSecret = Deno.env.get("CRON_SECRET");
  
  if (cronSecret && headerSecret === cronSecret) {
    await next();
    return;
  } else {
    return validateDeveloper(c, next);
  }
}