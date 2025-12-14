import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { generateRealEmailData, hasEmailContent } from "./email-digest-data-generator.tsx";
import { generateEmailHtml } from "./email-digest-template.tsx";
import { saveSentEmail } from "./kv-utils.tsx";
import type { SentEmail } from "./types.tsx";
import { sendEmailViaResend, getUsersToEmailWeeklyDigest } from "./email-sender-utils.tsx";

const app = new Hono();

app.use("*", cors());

const DAYS_7 = 7 * 24 * 60 * 60 * 1000;

app.post(
  "/make-server-f1a393b4/cron/orchestrate-digest-email",
  async (c) => {
    try {
      const secret = c.req.header("x-cron-secret");
      if (secret !== Deno.env.get("CRON_SECRET")) {
        console.log("[digest-orchestrator] Unauthorized request - invalid or missing cron secret");
        return c.json({ error: "Unauthorized" }, 401);
      }

      console.log("[digest-orchestrator] Starting email digest orchestration");

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.log("[digest-orchestrator] RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured" }, 500);
      }

      const now = Date.now();
      const last7Days = now - DAYS_7;

      const { usersToConsider, stats } = await getUsersToEmailWeeklyDigest();

      console.log(`[digest-orchestrator] Retrieved ${stats.totalUsers} total users`);
      console.log(`[digest-orchestrator] ${stats.recentlyEmailedCount} users recently emailed`);
      console.log(`[digest-orchestrator] ${stats.eligibleUsers} eligible users to consider for emails`);

      const results = {
        totalConsidered: usersToConsider.length,
        sent: 0,
        failed: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const user of usersToConsider) {
        try {
          console.log(`[digest-orchestrator] Processing user ${user.id} (${user.email})`);

          const emailData = await generateRealEmailData(user.id, last7Days);

          if (!hasEmailContent(emailData)) {
            console.log(
              `[digest-orchestrator] Skipping user ${user.id} - no activity in provided period`,
            );
            results.skipped++;
            continue;
          }

          const emailHtml = generateEmailHtml(emailData);

          const sendResult = await sendEmailViaResend({
            to: user.email,
            subject: `🔥 The Latest on Heard`,
            html: emailHtml,
          });

          if (!sendResult.success) {
            console.log(
              `[digest-orchestrator] Failed to send to ${user.email}: ${sendResult.error}`,
            );
            results.failed++;
            results.errors.push(`${user.email}: ${sendResult.error}`);
            continue;
          }

          console.log(
            `[digest-orchestrator] Sent to ${user.email}, emailId: ${sendResult.emailId}`,
          );

          const sentEmailRecord: SentEmail = {
            id: `${user.id}_${now}`,
            userId: user.id,
            sentAt: now,
            emailType: "weekly_digest",
          };
          await saveSentEmail(sentEmailRecord);
          console.log(`[digest-orchestrator] Saved sent email record for user ${user.id}`);

          results.sent++;
        } catch (error) {
          console.log(
            `[digest-orchestrator] Error processing user ${user.id}:`,
            error,
          );
          results.failed++;
          results.errors.push(
            `${user.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      console.log("[digest-orchestrator] Completed:", results);

      return c.json({
        success: true,
        message: `Processed ${results.totalConsidered} users`,
        results,
      });
    } catch (error) {
      console.log("[digest-orchestrator] Fatal error:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unknown error processing email digest orchestration",
        },
        500,
      );
    }
  },
);

export { app as digestEmailOrchestratorApi };