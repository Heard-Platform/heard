import { mergeAnonymousUserActivity } from "./anonymous-merge-utils.tsx";
import { getUserAndNewSession } from "./auth-api.tsx";
import { getUser } from "./kv-utils.tsx";
import { getDebateRoom } from "./debate-api.tsx";

async function validateHostImpl(c: any, next: any, trueHostOnly: boolean) {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const user = await getUser(userId);
  if (user?.isDeveloper) {
    await next();
    return;
  }

  const roomId = c.req.param("roomId");
  const room = await getDebateRoom(roomId);
  if (!room) return c.json({ error: "Room not found" }, 404);

  const allowed = trueHostOnly
    ? room.hostId === userId
    : room.hostId === userId || !!room.coHostIds?.includes(userId);

  if (!allowed) return c.json({ error: "Forbidden" }, 403);

  await next();
}

export const validateHost = (c: any, next: any) => validateHostImpl(c, next, false);
export const validateTrueHost = (c: any, next: any) => validateHostImpl(c, next, true);

export async function validateSession(c: any, next: any) {
  const userId = c.get("userId");
  
  if (!userId) {
    console.warn("Unauthorized account access attempt with no session");
    return c.json({ error: "Unauthorized - No session" }, 401);
  }

  await next();
}

export const normalizePhoneNumber = (phone: string): string => {
  let normalizedPhone = phone.replace(/\D/g, "");

  if (phone.length === 10) {
    normalizedPhone = `+1${phone}`;
  } else if (phone.length === 11) {
    normalizedPhone = `+${phone}`;
  }

  return normalizedPhone;
};

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