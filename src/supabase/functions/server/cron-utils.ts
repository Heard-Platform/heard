import { validateDeveloper } from "./internal-utils.ts";

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