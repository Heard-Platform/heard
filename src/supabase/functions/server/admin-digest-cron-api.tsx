import { Hono } from "npm:hono@4";
import { defineRoute } from "./route-wrapper.tsx";
import { getAdminDailyStats, generateAdminDigestHtml } from "./admin-digest.tsx";
import { getDevUsers, getSentEmails, saveSentEmail } from "./kv-utils.tsx";
import { sendEmailViaResend } from "./email-sender-utils.tsx";
import type { SentEmail } from "./types.tsx";

const app = new Hono();

const HOURS_24 = 24 * 60 * 60 * 1000;
const ADMIN_DIGEST_EMAIL_TYPE = "admin_daily_digest";

app.post(
  "/make-server-f1a393b4/cron/admin-daily-digest",
  defineRoute(
    {},
    async () => {
      const now = Date.now();

      const allSentEmails = await getSentEmails();
      const recentAdminDigests = allSentEmails.filter(
        (email: any) =>
          email.emailType === ADMIN_DIGEST_EMAIL_TYPE &&
          email.sentAt >= now - HOURS_24
      );

      if (recentAdminDigests.length > 0) {
        console.log(
          `[admin-daily-digest] Skipping - already sent ${recentAdminDigests.length} in past 24 hours`
        );
        return { sent: 0, failed: 0, skipped: 1, errors: [] };
      }

      const [adminStats, devUsers] = await Promise.all([
        getAdminDailyStats(HOURS_24),
        getDevUsers(),
      ]);

      console.log(`[admin-daily-digest] Found ${devUsers.length} developer users`);
      console.log("[admin-daily-digest] Admin stats:", adminStats);

      const results = { sent: 0, failed: 0, skipped: 0, errors: [] as string[] };

      if (devUsers.length === 0) {
        return results;
      }

      const adminEmailHtml = generateAdminDigestHtml(adminStats);

      for (const dev of devUsers) {
        try {
          const sendResult = await sendEmailViaResend({
            to: dev.email,
            subject: "📊 Heard Admin Daily Digest",
            html: adminEmailHtml,
          });

          if (!sendResult.success) {
            console.log(
              `[admin-daily-digest] Failed to send to ${dev.email}: ${sendResult.error}`
            );
            results.failed++;
            results.errors.push(`${dev.email}: ${sendResult.error}`);
            continue;
          }

          const sentEmailRecord: SentEmail = {
            id: `${dev.id}_admin_${now}`,
            userId: dev.id,
            sentAt: now,
            emailType: ADMIN_DIGEST_EMAIL_TYPE,
          };
          await saveSentEmail(sentEmailRecord);

          results.sent++;
        } catch (error) {
          console.log(`[admin-daily-digest] Error sending to ${dev.email}:`, error);
          results.failed++;
          results.errors.push(
            `${dev.email}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      return results;
    },
    "Failed to send admin daily digest"
  )
);

export { app as adminDigestCronApi };
