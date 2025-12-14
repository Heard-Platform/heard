import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { generateRealEmailData, hasEmailContent } from "./email-digest-data-generator.tsx";
import { generateEmailHtml } from "./email-digest-template.tsx";
import { getAllRealUsers } from "./db-utils.ts";
import { UserSession } from "./types.tsx";

const app = new Hono();

app.use("*", cors());

const HOURS_24 = 24 * 60 * 60 * 1000;

export const getEligibleEmailUsers = async (): Promise<UserSession[]> => {
  const allUsers = await getAllRealUsers();
  
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const oneWeekAgo = Date.now() - ONE_WEEK;
  
  return allUsers.filter((user) => 
    !user.isTestUser && 
    user.lastActive >= oneWeekAgo &&
    user.email
  );
};

app.post(
  "/make-server-f1a393b4/cron/send-digest-email",
  async (c) => {
    try {
      const secret = c.req.header("x-cron-secret");
      if (secret !== Deno.env.get("CRON_SECRET")) {
        console.log("[dev-digest] Unauthorized request - invalid or missing cron secret");
        return c.json({ error: "Unauthorized" }, 401);
      }

      console.log("[dev-digest] Starting developer digest email check");

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.log("[dev-digest] RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured" }, 500);
      }

      const eligibleUsers = await getEligibleEmailUsers();
      console.log(`[dev-digest] Retrieved ${eligibleUsers.length} eligible users (active in last week, not test users, with email)`);
      
      const now = Date.now();
      const last24Hours = now - HOURS_24;

      const results = {
        totalUsers: eligibleUsers.length,
        sent: 0,
        failed: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const user of eligibleUsers) {
        try {
          console.log(`[dev-digest] Processing user ${user.id} (${user.email})`);

          const emailData = await generateRealEmailData(user.id, last24Hours);

          if (!hasEmailContent(emailData)) {
            console.log(
              `[dev-digest] Skipping user ${user.id} - no activity in last 24 hours`,
            );
            results.skipped++;
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
                subject: `🔧 Dev Digest - Activity in Last 24 Hours`,
                html: emailHtml,
              }),
            },
          );

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.log(
              `[dev-digest] Failed to send to ${user.email}: ${errorText}`,
            );
            results.failed++;
            results.errors.push(`${user.email}: ${errorText}`);
            continue;
          }

          const result = await resendResponse.json();
          console.log(
            `[dev-digest] Sent to ${user.email}, emailId: ${result.id}`,
          );

          results.sent++;
        } catch (error) {
          console.log(
            `[dev-digest] Error processing user ${user.id}:`,
            error,
          );
          results.failed++;
          results.errors.push(
            `${user.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      console.log("[dev-digest] Completed:", results);

      return c.json({
        success: true,
        message: `Processed ${results.totalUsers} users`,
        results,
      });
    } catch (error) {
      console.log("[dev-digest] Fatal error:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unknown error processing developer digest",
        },
        500,
      );
    }
  },
);

export { app as digestEmailSenderApi };