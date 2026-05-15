import { Hono } from "npm:hono";
import {
  getAllDebates,
  getUser,
  getDebateEndedEmailSent,
  saveDebateEndedEmailSent,
  saveSentEmail,
} from "./kv-utils.tsx";
import { getFrontendUrl } from "./utils.tsx";
import type { DebateRoom, SentEmail } from "./types.tsx";
import { getStatements } from "./debate-api.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { validateDeveloper } from "./internal-utils.ts";
import { sendEmailViaResend } from "./email-sender-utils.tsx";
import {
  DEBATE_ENDED_EMAIL_TYPE,
  generateDebateEndedEmailHtml,
  getDebateEndedSubject,
  type OtherConvo,
} from "./email-debate-ended-template.tsx";
import { rankStatements } from "./statement-utils.tsx";

const app = new Hono();

export async function validateCronAuth(c: any, next: any) {
  const headerSecret = c.req.header("x-cron-secret");
  const cronSecret = Deno.env.get("CRON_SECRET");
  
  if (cronSecret && headerSecret === cronSecret) {
    await next();
    return;
  } else {
    return validateDeveloper(c, next);
  }
}

const MAX_OTHER_CONVOS = 3;
const MAX_TOP_STATEMENTS = 3;

const findOtherConvosInSubHeard = (
  endedRoom: DebateRoom,
  allRooms: DebateRoom[],
  now: number,
): OtherConvo[] => {
  if (!endedRoom.subHeard) return [];
  return allRooms
    .filter(
      (r) =>
        r.id !== endedRoom.id &&
        r.subHeard === endedRoom.subHeard &&
        r.isActive &&
        !r.isTestRoom &&
        (!r.endTime || r.endTime > now),
    )
    .sort(
      (a, b) =>
        (b.lastActivityAt ?? b.createdAt) -
        (a.lastActivityAt ?? a.createdAt),
    )
    .slice(0, MAX_OTHER_CONVOS)
    .map((r) => ({
      id: r.id,
      topic: r.topic,
      participantCount: r.participants.length,
    }));
};

export async function sendDebateEndedEmails(
  room: DebateRoom,
  allRooms: DebateRoom[],
  now: number,
): Promise<{ sent: number; failed: number; skipped: number }> {
  const result = { sent: 0, failed: 0, skipped: 0 };

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log(
      `[debate-ended-email] RESEND_API_KEY not configured, skipping emails for room ${room.id}`,
    );
    result.skipped = room.participants.length;
    return result;
  }

  const statements = await getStatements(room.id);
  const totalVotes = statements.reduce(
    (sum, s) =>
      sum + s.superAgrees + s.agrees + s.disagrees + s.passes,
    0,
  );
  const { topStatements, mostDisagreed, spiciest } = rankStatements(
    statements,
    MAX_TOP_STATEMENTS,
  );
  const otherConvos = findOtherConvosInSubHeard(room, allRooms, now);
  const subject = getDebateEndedSubject(room.topic);
  const frontendUrl = getFrontendUrl();

  for (const userId of room.participants) {
    try {
      const user = await getUser(userId);
      if (!user) {
        result.skipped++;
        continue;
      }
      if (!user.email) {
        result.skipped++;
        continue;
      }
      if (user.emailDigestsEnabled === false) {
        result.skipped++;
        continue;
      }
      if (user.isTestUser || user.webdriver) {
        result.skipped++;
        continue;
      }

      const html = generateDebateEndedEmailHtml({
        room,
        topStatements,
        mostDisagreed,
        spiciest,
        totalVotes,
        participantCount: room.participants.length,
        otherConvos,
        frontendUrl,
        userId: user.id,
      });

      const sendResult = await sendEmailViaResend({
        to: user.email,
        subject,
        html,
      });

      if (!sendResult.success) {
        console.log(
          `[debate-ended-email] Failed for user ${user.id} room ${room.id}: ${sendResult.error}`,
        );
        result.failed++;
        continue;
      }

      const sentEmailRecord: SentEmail = {
        id: `${user.id}_${DEBATE_ENDED_EMAIL_TYPE}_${room.id}`,
        userId: user.id,
        sentAt: now,
        emailType: DEBATE_ENDED_EMAIL_TYPE,
      };
      await saveSentEmail(sentEmailRecord);
      result.sent++;
    } catch (error) {
      console.log(
        `[debate-ended-email] Error for user ${userId} room ${room.id}:`,
        error,
      );
      result.failed++;
    }
  }

  return result;
}

app.post(
  "/make-server-f1a393b4/cron/send-completion-celebrations",
  validateCronAuth,
  defineRoute(
    {},
    async () => {
      const now = Date.now();
      const twentyMinutesAgo = now - (20 * 60 * 1000);

      const allRooms = await getAllDebates();
      const recentlyEndedRooms = allRooms.filter(room =>
        room.endTime &&
        room.endTime >= twentyMinutesAgo &&
        room.endTime <= now
      );

      console.log(`Found ${recentlyEndedRooms.length} recently ended debates`);

      const results = [];
      for (const room of recentlyEndedRooms) {
        const emailAlreadySent = await getDebateEndedEmailSent(room.id);
        let emailResult = { sent: 0, failed: 0, skipped: 0 };
        if (!emailAlreadySent) {
          try {
            emailResult = await sendDebateEndedEmails(room, allRooms, now);
            await saveDebateEndedEmailSent(room.id);
          } catch (error: any) {
            console.error(`Failed to send debate-ended emails for room ${room.id}:`, error);
          }
        } else {
          console.log(`Debate-ended emails already sent for room ${room.id}`);
        }

        results.push({
          roomId: room.id,
          emails: emailResult,
        });
      }

      return {
        processed: results.length,
        results: results,
      };
    },
    "Failed to process completion cron job"
  ),
);

export { app as cronApi };