import { Context, Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getUser } from "./kv-utils.tsx";
import { mergeAnonymousUserActivity } from "./anonymous-merge-utils.tsx";
import { getUserAndNewSession } from "./auth-api.tsx";
import { startVerification, checkVerification } from "./twilio-service.tsx";

const app = new Hono();

const getUserByPhone = async (phone: string) => {
  const userId = await kv.get(`user_phone:${phone}`);
  if (!userId) return null;
  return await getUser(userId);
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

app.post(
  "/make-server-f1a393b4/auth/send-sms-code",
  async (c: any) => {
    try {
      const { phone } = await c.req.json();

      if (!phone) {
        return c.json({ error: "Phone number is required" }, 400);
      }

      const normalizedPhone = phone.replace(/\D/g, "");

      if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
        return c.json({ error: "Invalid phone number" }, 400);
      }

      const user = await getUserByPhone(normalizedPhone);

      if (!user) {
        return c.json(
          { error: "No account found with this phone number" },
          404,
        );
      }

      const verificationResult = await startVerification(normalizedPhone);
      
      if (!verificationResult.success) {
        console.error(`Failed to start verification for ${normalizedPhone}:`, verificationResult.error);
        return c.json({ error: "Failed to send SMS code. Please try again." }, 500);
      }

      console.log(`Verification started successfully for ${normalizedPhone}`);

      return c.json({ success: true });
    } catch (error) {
      console.error("Error sending SMS code:", error);
      return c.json({ error: "Failed to send SMS code" }, 500);
    }
  },
);

app.post(
  "/make-server-f1a393b4/auth/verify-sms-code",
  async (c: Context) => {
    try {
      const currentUserId = c.get("userId");
      const { phone, code } = await c.req.json();

      if (!phone || !code) {
        return c.json({ error: "Phone and code are required" }, 400);
      }

      const normalizedPhone = phone.replace(/\D/g, "");
      const verificationResult = await checkVerification(normalizedPhone, code);

      if (!verificationResult.success) {
        return c.json({ error: verificationResult.error || "Invalid or expired code" }, 401);
      }

      const user = await getUserByPhone(normalizedPhone);

      if (!user) {
        return c.json({ error: "No account found with this phone number" }, 404);
      }

      const result = await loginUserWithMerge(user.id, currentUserId);
      if ("error" in result) {
        return c.json({ error: result.error }, result.status as any);
      }

      return c.json(result);
    } catch (error) {
      console.error("Error verifying SMS code:", error);
      return c.json({ error: "Failed to verify SMS code" }, 500);
    }
  },
);

export { app as smsAuthApi };