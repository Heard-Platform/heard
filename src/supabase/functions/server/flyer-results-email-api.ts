import { Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { isAfterRevealTime } from "./flyer-results-time.ts";
import { sendFlyerResultsEmails } from "./service-flyer-results-email.ts";
import { EMAIL_JOBS, isScheduleOn } from "./email-jobs.ts";
import { FLYER_RESULTS_EMAIL_TYPE } from "./template-flyer-results.ts";

const app = new Hono();

app.post(
  `${API_URL_PREFIX}/cron/flyer-results-email`,
  defineRoute(
    {},
    async () => {
      if (!(await isScheduleOn(EMAIL_JOBS[FLYER_RESULTS_EMAIL_TYPE]))) {
        return { sent: 0, reason: "Mailer is turned off in the admin panel" };
      }
      const now = Date.now();
      if (!isAfterRevealTime(now)) {
        return { sent: 0, reason: "Before 7 PM Eastern" };
      }
      const summary = await sendFlyerResultsEmails(now);
      console.log("[flyer-results-email] Run summary:", summary);
      return summary;
    },
    "Failed to send flyer results emails",
  ),
);

export { app as flyerResultsEmailApi };
