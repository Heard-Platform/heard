import { Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { getUser, getUserIdByEmail } from "./kv-utils.tsx";
import { isAfterRevealTime } from "./flyer-results-time.ts";
import { sendFlyerResultsEmails, sendTestFlyerResultsEmail } from "./service-flyer-results-email.ts";

const app = new Hono();

app.post(
  `${API_URL_PREFIX}/cron/flyer-results-email`,
  defineRoute(
    {},
    async () => {
      const now = Date.now();
      if (!isAfterRevealTime(now)) {
        return { sent: 0, skipped: 0, failed: 0, reason: "Before 7 PM Eastern" };
      }
      const summary = await sendFlyerResultsEmails(now);
      console.log("[flyer-results-email] Run summary:", summary);
      return summary;
    },
    "Failed to send flyer results emails",
  ),
);

app.post(
  `${API_URL_PREFIX}/dev/flyer-results-email/send-test`,
  defineRoute(
    { email: { type: "string", required: true } },
    async ({ email }: { email: string }) => {
      const userId = await getUserIdByEmail(email);
      const user = userId ? await getUser(userId) : null;
      if (!user?.email) throw new Error(`No user found for ${email}`);
      return sendTestFlyerResultsEmail({ ...user, email: user.email });
    },
    "Failed to send test flyer results email",
  ),
);

export { app as flyerResultsEmailApi };
