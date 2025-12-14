import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import * as kvUtils from "./kv-utils.tsx";
import { generateRealEmailData } from "./email-data-generator.tsx";
import { generateEmailHtml } from "./email-previews.tsx";
import type { UserSession } from "./types.tsx";

const app = new Hono();

app.use("*", cors());

const HOURS_14 = 14 * 60 * 60 * 1000;
const HOURS_18 = 18 * 60 * 60 * 1000;

function hasEmailContent(data: any): boolean {
  return (
    data.conversationsStarted.length > 0 ||
    data.takesPosted.length > 0 ||
    data.conversationsParticipated.length > 0 ||
    data.communities.length > 0
  );
}

app.post(
  "/make-server-f1a393b4/cron/send-onboarding-emails",
  async (c) => {
    try {
      const devAdminKey = Deno.env.get("DEV_ADMIN_KEY");
      const authHeader = c.req.header("Authorization");
      
      if (!authHeader || authHeader !== `Bearer ${devAdminKey}`) {
        console.log("[onboarding-emails] Unauthorized request");
        return c.json({ error: "Unauthorized" }, 401);
      }

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.log("[onboarding-emails] RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured" }, 500);
      }

      console.log("[onboarding-emails] Starting onboarding email check");

      const allUsers = await kvUtils.getByPrefixParsed<UserSession>("user:");
      console.log(`[onboarding-emails] Found ${allUsers.length} total users`);

      const now = Date.now();
      const eligibleUsers = allUsers.filter((user) => {
        if (!user.email) return false;
        
        if (user.onboardingEmailSentAt) return false;
        
        const timeSinceSignup = now - user.createdAt;
        return timeSinceSignup >= HOURS_14 && timeSinceSignup <= HOURS_18;
      });

      console.log(
        `[onboarding-emails] Found ${eligibleUsers.length} eligible users`,
      );

      const results = {
        totalChecked: allUsers.length,
        eligible: eligibleUsers.length,
        sent: 0,
        failed: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const user of eligibleUsers) {
        try {
          console.log(`[onboarding-emails] Processing user ${user.id} (${user.email})`);

          const emailData = await generateRealEmailData(user.id, user.createdAt);

          if (!hasEmailContent(emailData)) {
            console.log(
              `[onboarding-emails] Skipping user ${user.id} - no content`,
            );
            results.skipped++;
            
            await kvUtils.updateUserField(user.id, "onboardingEmailSentAt", now);
            continue;
          }

          const emailHtml = generateEmailHtml(emailData);

          const resendResponse = await fetch(
            "https://api.resend.com/emails",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "Heard <updates@heard-now.com>",
                to: [user.email],
                subject: "🎯 Your First Day on Heard - Here's What Happened!",
                html: emailHtml,
              }),
            },
          );

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.log(
              `[onboarding-emails] Failed to send to ${user.email}: ${errorText}`,
            );
            results.failed++;
            results.errors.push(`${user.email}: ${errorText}`);
            continue;
          }

          const result = await resendResponse.json();
          console.log(
            `[onboarding-emails] Sent to ${user.email}, emailId: ${result.id}`,
          );

          await kvUtils.updateUserField(user.id, "onboardingEmailSentAt", now);

          results.sent++;
        } catch (error) {
          console.log(
            `[onboarding-emails] Error processing user ${user.id}:`,
            error,
          );
          results.failed++;
          results.errors.push(
            `${user.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      console.log("[onboarding-emails] Completed:", results);

      return c.json({
        success: true,
        message: `Processed ${results.eligible} eligible users`,
        results,
      });
    } catch (error) {
      console.log("[onboarding-emails] Fatal error:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unknown error processing onboarding emails",
        },
        500,
      );
    }
  },
);

export { app };
