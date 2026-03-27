import { Context, Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getUser, saveUser, saveUserPhone } from "./kv-utils.tsx";
import { startVerification, checkVerification } from "./twilio-service.tsx";
import { loginUserWithMerge, normalizePhoneNumber, validateSession } from "./auth-utils.ts";
import { sanitizeUser } from "./user-utils.ts";
import { createUserAccount } from "./auth-api.tsx";

const app = new Hono();

const getUserByPhone = async (phone: string) => {
  const userId = await kv.get(`user_phone:${phone}`);
  if (!userId) return null;
  return await getUser(userId);
};

app.post(
  "/make-server-f1a393b4/auth/send-sms-code",
  async (c: any) => {
    try {
      const { phone, requireExisting } = await c.req.json();

      if (!phone) {
        return c.json({ error: "Phone number is required" }, 400);
      }

      const normalizedPhone = normalizePhoneNumber(phone);

      if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
        return c.json({ error: "Invalid phone number" }, 400);
      }

      const user = await getUserByPhone(normalizedPhone);

      if (requireExisting && !user) {
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
  validateSession,
  async (c: Context) => {
    try {
      const currentUserId = c.get("userId");
      const {
        phone,
        code,
        tosAcknowledged,
        privacyPolicyAcknowledged,
      } = await c.req.json();
      
      if (!phone || !code) {
        return c.json({ error: "Phone and code are required" }, 400);
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      const verificationResult = await checkVerification(normalizedPhone, code);

      if (!verificationResult.success) {
        return c.json({ error: verificationResult.error || "Invalid or expired code" }, 401);
      }

      let user = await getUserByPhone(normalizedPhone);

      if (!user) {
        user = await createUserAccount({
          phoneNumber: normalizedPhone,
          phoneVerified: true,
          phoneVerifiedAt: Date.now(),
        })

        await saveUserPhone(normalizedPhone, user.id);
      }

      if (!user.tosAgreedToAt && tosAcknowledged) {
        user.tosAgreedToAt = Date.now();
        user.tosVersion = "1.0";
        await saveUser(user);
      }

      if (!user.privacyPolicyAgreedToAt && privacyPolicyAcknowledged) {
        user.privacyPolicyAgreedToAt = Date.now();
        user.privacyPolicyVersion = "1.0";
        await saveUser(user);
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

app.post(
  "/make-server-f1a393b4/auth/add-phone-to-account",
  validateSession,
  async (c: Context) => {
    try {
      const userId = c.get("userId");
      const { phone, code } = await c.req.json();

      if (!phone || !code) {
        return c.json({ error: "Phone and code are required" }, 400);
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      const verificationResult = await checkVerification(normalizedPhone, code);

      if (!verificationResult.success) {
        return c.json({ error: verificationResult.error || "Invalid or expired code" }, 401);
      }

      const existingUser = await getUserByPhone(normalizedPhone);
      if (existingUser) {
        return c.json({ error: "This phone number is already registered to another account" }, 409);
      }

      const user = await getUser(userId);
      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      await saveUserPhone(normalizedPhone, userId);
      
      const updatedUser = { 
        ...user, 
        phoneNumber: normalizedPhone, 
        phoneVerified: true, 
        phoneVerifiedAt: Date.now() 
      };
      await saveUser(updatedUser);

      return c.json({ 
        user: sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error("Error adding phone to account:", error);
      return c.json({ error: "Failed to add phone to account" }, 500);
    }
  },
);

export { app as loginApi };