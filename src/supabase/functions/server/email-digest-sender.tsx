import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { generateRealEmailData, hasEmailContent } from "./email-digest-data-generator.tsx";
import { getAllUsers } from "./db-utils.ts";
import { generateEmailHtml } from "./email-digest-template.tsx";

const app = new Hono();

app.use("*", cors());

const HOURS_24 = 24 * 60 * 60 * 1000;

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

      const allUsers = await getAllUsers();
      console.log(`[dev-digest] Retrieved ${allUsers.length} total users`);
      const developers1 = allUsers.filter((user) => user.isDeveloper );
      console.log(`[dev-digest] Found ${developers1.length} developer users (including those without email)`);
      const developers = allUsers.filter((user) => user.isDeveloper && user.email);

      console.log(`[dev-digest] Found ${developers.length} developer users with emails`);

      const now = Date.now();
      const last24Hours = now - HOURS_24;

      const results = {
        totalDevelopers: developers.length,
        sent: 0,
        failed: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const developer of developers) {
        try {
          console.log(`[dev-digest] Processing developer ${developer.id} (${developer.email})`);

          const emailData = await generateRealEmailData(developer.id, last24Hours);

          if (!hasEmailContent(emailData)) {
            console.log(
              `[dev-digest] Skipping developer ${developer.id} - no activity in last 24 hours`,
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
                to: [developer.email],
                subject: `🔧 Dev Digest - Activity in Last 24 Hours`,
                html: emailHtml,
              }),
            },
          );

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.log(
              `[dev-digest] Failed to send to ${developer.email}: ${errorText}`,
            );
            results.failed++;
            results.errors.push(`${developer.email}: ${errorText}`);
            continue;
          }

          const result = await resendResponse.json();
          console.log(
            `[dev-digest] Sent to ${developer.email}, emailId: ${result.id}`,
          );

          results.sent++;
        } catch (error) {
          console.log(
            `[dev-digest] Error processing developer ${developer.id}:`,
            error,
          );
          results.failed++;
          results.errors.push(
            `${developer.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      console.log("[dev-digest] Completed:", results);

      return c.json({
        success: true,
        message: `Processed ${results.totalDevelopers} developers`,
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