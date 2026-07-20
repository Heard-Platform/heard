import { Hono } from "npm:hono";
import { defineRoute } from "./route-wrapper.tsx";
import { getAllRealUsers, getSentEmails } from "./kv-utils.tsx";
import { API_URL_PREFIX } from "./constants.tsx";
import { obfuscateEmail } from "./utils.tsx";

const app = new Hono();

const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const MASK = "••••";

app.get(
  `${API_URL_PREFIX}/dev/sent-emails`,
  defineRoute(
    {},
    async () => {
      const cutoff = Date.now() - WINDOW_DAYS * DAY_MS;
      const [sentEmails, users] = await Promise.all([
        getSentEmails(),
        getAllRealUsers(),
      ]);

      const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

      const data = sentEmails
        .filter((e) => e.sentAt >= cutoff)
        .map((e) => {
          const realEmail = emailByUserId.get(e.userId);
          return {
            id: e.id,
            recipientId: e.userId,
            recipientEmail: realEmail ? obfuscateEmail(realEmail) : `${MASK}@${MASK}`,
            template: e.emailType,
            sentAt: e.sentAt,
          };
        });

      return { sentEmails: data };
    },
    "Error fetching sent emails",
  ),
);

export { app as sentEmailsApi };
