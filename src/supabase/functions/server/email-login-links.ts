import { saveEmailLoginLink } from "./kv-utils.tsx";
import { ONE_DAY_MS } from "./time-utils.ts";

const EMAIL_LOGIN_LINK_TTL_MS = 14 * ONE_DAY_MS;

export const createEmailLoginToken = async (userId: string): Promise<string> => {
  const token = crypto.randomUUID();
  await saveEmailLoginLink(token, { userId, expiresAt: Date.now() + EMAIL_LOGIN_LINK_TTL_MS });
  return token;
};
