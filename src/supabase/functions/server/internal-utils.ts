import { validateSessionContext } from "./auth-utils.ts";
import { AUTH_ERROR_403_MESSAGE } from "./constants.tsx";
import { getUser } from "./kv-utils.tsx";

export async function validateDeveloperContext(c: any) {
  const userId = await validateSessionContext(c);

  const user = await getUser(userId);
  if (!user || !user.isDeveloper) {
    throw new Error(AUTH_ERROR_403_MESSAGE);
  }

  return userId;
}

export async function validateDeveloper(c: any, next: any) {
  try {
    await validateDeveloperContext(c);
  } catch (error: any) {
    return c.json({ error: error.message }, error.message === AUTH_ERROR_403_MESSAGE ? 403 : 401);
  }
  await next();
}
