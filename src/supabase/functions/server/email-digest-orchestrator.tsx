import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { generateRealEmailData, hasEmailContent } from "./email-digest-data-generator.tsx";
import { generateEmailHtml } from "./email-digest-template.tsx";
import { saveSentEmail } from "./kv-utils.tsx";
import type { SentEmail } from "./types.tsx";
import { sendEmailViaResend, getUsersToEmailDigest } from "./email-sender-utils.tsx";

const app = new Hono();

app.use("*", cors());

const DAYS_7 = 7 * 24 * 60 * 60 * 1000;
const HOURS_24 = 24 * 60 * 60 * 1000;

const getDigestConfig = (digestType: string) => {
  if (digestType === "first_day_digest") {
    return {
      cutoffTime: Date.now() - HOURS_24,
      subject: "🔥 Your First Day on Heard",
      logPrefix: "new user",
    };
  }
  return {
    cutoffTime: Date.now() - DAYS_7,
    subject: "🔥 The Latest on Heard",
    logPrefix: "weekly",
  };
};

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

      const digestTypes = [
        { type: "weekly_digest", cutoffDays: 7, filterByNewUsers: false },
        { type: "first_day_digest", cutoffDays: 1, filterByNewUsers: true },
      ];

      const allResults = [];

      for (const { type, cutoffDays, filterByNewUsers } of digestTypes) {
        const { usersToConsider, stats } = await getUsersToEmailDigest(type, cutoffDays, filterByNewUsers);
        const config = getDigestConfig(type);

        console.log(`[digest-orchestrator] === ${type.toUpperCase()} ===`);
        console.log(`[digest-orchestrator] Retrieved ${stats.totalUsers} total users`);
        console.log(`[digest-orchestrator] ${stats.recentlyEmailedCount} users recently emailed`);
        console.log(`[digest-orchestrator] ${stats.eligibleUsers} eligible users to consider`);

        const results = {
          digestType: type,
          totalConsidered: usersToConsider.length,
          sent: 0,
          failed: 0,
          skipped: 0,
          errors: [] as string[],
        };

        for (const user of usersToConsider) {
          try {
            console.log(`[digest-orchestrator] Processing ${config.logPrefix} user ${user.id} (${user.email})`);

            const emailData = await generateRealEmailData(user.id, config.cutoffTime);

            if (!hasEmailContent(emailData)) {
              console.log(
                `[digest-orchestrator] Skipping ${config.logPrefix} user ${user.id} - no activity`,
              );
              results.skipped++;
              continue;
            }

            const emailHtml = generateEmailHtml(emailData);

            const sendResult = await sendEmailViaResend({
              to: user.email,
              subject: config.subject,
              html: emailHtml,
            });

            if (!sendResult.success) {
              console.log(
                `[digest-orchestrator] Failed to send ${config.logPrefix} email to ${user.email}: ${sendResult.error}`,
              );
              results.failed++;
              results.errors.push(`${user.email}: ${sendResult.error}`);
              continue;
            }

            console.log(
              `[digest-orchestrator] Sent ${config.logPrefix} email to ${user.email}, emailId: ${sendResult.emailId}`,
            );

            const sentEmailRecord: SentEmail = {
              id: `${user.id}_${now}`,
              userId: user.id,
              sentAt: now,
              emailType: type,
            };
            await saveSentEmail(sentEmailRecord);

            results.sent++;
          } catch (error) {
            console.log(
              `[digest-orchestrator] Error processing ${config.logPrefix} user ${user.id}:`,
              error,
            );
            results.failed++;
            results.errors.push(
              `${user.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }

        allResults.push(results);
      }

      console.log("=== COMPLETED ===");
      allResults.forEach(result => {
        console.log(`[digest-orchestrator] ${result.digestType} Results:`, result);
      });

      return c.json({
        success: true,
        message: `Processed ${allResults.map(r => `${r.totalConsidered} ${r.digestType}`).join(" and ")} users`,
        results: allResults,
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