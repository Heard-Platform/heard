import twilio from "npm:twilio";
import { normalizePhoneNumber } from "./auth-utils.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

const getClient = () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};


export const startVerification = async (normalizedPhone: string): Promise<{ success: boolean; error?: string }> => {
  const client = getClient();
  if (!client || !TWILIO_VERIFY_SERVICE_SID) {
    console.error("Missing Twilio Verify credentials");
    return { success: false, error: "SMS verification service not configured" };
  }

  try {
    const verification = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: normalizedPhone,
        channel: "sms",
      });

    console.log("Verification started successfully:", verification.sid);
    return { success: true };
  } catch (error) {
    console.error("Error starting verification via Twilio:", error);
    return { success: false, error: error.message || "Failed to send verification code" };
  }
};

export const checkVerification = async (normalizedPhone: string, code: string): Promise<{ success: boolean; error?: string }> => {
  const client = getClient();
  if (!client || !TWILIO_VERIFY_SERVICE_SID) {
    console.error("Missing Twilio Verify credentials");
    return { success: false, error: "SMS verification service not configured" };
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: normalizedPhone,
        code: code,
      });

    if (verificationCheck.status === "approved") {
      console.log("Verification approved:", verificationCheck.sid);
      return { success: true };
    } else {
      console.log("Verification not approved, status:", verificationCheck.status);
      return { success: false, error: "Invalid or expired verification code" };
    }
  } catch (error) {
    console.error("Error checking verification via Twilio:", error);
    return { success: false, error: error.message || "Failed to verify code" };
  }
};

export const sendSms = async (to: string, body: string): Promise<{ success: boolean; error?: string }> => {
  const client = getClient();
  if (!client) {
    console.error("Missing Twilio credentials");
    return { success: false, error: "SMS service not configured" };
  }

  const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER") || "+15017122661";

  try {
    const message = await client.messages.create({
      body: body,
      from: TWILIO_PHONE_NUMBER,
      to: normalizePhoneNumber(to),
    });

    console.log("SMS sent successfully:", message.sid);
    return { success: true };
  } catch (error) {
    console.error("Error sending SMS via Twilio:", error);
    return { success: false, error: error.message || "Failed to send SMS" };
  }
};