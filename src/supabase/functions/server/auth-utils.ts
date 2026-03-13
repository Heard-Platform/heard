import { mergeAnonymousUserActivity } from "./anonymous-merge-utils.tsx";
import { getUserAndNewSession } from "./auth-api.tsx";
import { AUTH_ERROR_401_MESSAGE } from "./constants.tsx";
import { getUser } from "./kv-utils.tsx";

export const normalizePhoneNumber = (phone: string): string => {
  let normalizedPhone = phone.replace(/\D/g, "");

  if (phone.length === 10) {
    normalizedPhone = `+1${phone}`;
  } else if (phone.length === 11) {
    normalizedPhone = `+${phone}`;
  }

  return normalizedPhone;
};

export async function validateSessionContext(c: any): Promise<string> {
  const userId = c.get("userId");

  if (!userId) {
    throw new Error(AUTH_ERROR_401_MESSAGE);
  }

  return userId;
}

export async function validateSession(c: any, next: any) {
  try {
    await validateSessionContext(c);
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }

  await next();
}


export const loginUserWithMerge = async (userId: string, currentUserId: string | undefined) => {
  const result = await getUserAndNewSession(userId);
  if ("error" in result) {
    return result;
  }

  if (currentUserId) {
    const currentUser = await getUser(currentUserId);
    if (currentUser?.isAnonymous) {
      try {
        await mergeAnonymousUserActivity(currentUserId, userId);
      } catch (error) {
        console.error("Error during anonymous activity merge:", error);
      }
    }
  }

  return result;
};