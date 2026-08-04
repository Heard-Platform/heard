// @ts-ignore
import { Hono } from "npm:hono";
import { getAllRecords } from "./db-utils.ts";
import { getDebate, getUser, getSentEmails, saveSentEmail } from "./kv-utils.tsx";
import { getStatements } from "./debate-api.tsx";
import { getTotalVoteCount, rankStatements } from "./statement-utils.tsx";
import { CommunityMembership } from "./types.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { sendEmailViaResend } from "./email-sender-utils.tsx";
import { getFrontendUrl } from "./utils.tsx";
import {
  COMMUNITY_POST_INVITE_EMAIL_TYPE,
  generateCommunityPostInviteEmailHtml,
  getCommunityPostInviteSubject,
} from "./email-community-post-invite-template.tsx";

const app = new Hono();

const MAX_TOP_STATEMENTS = 3;

app.post(
  "/make-server-f1a393b4/one-time-fixes/invite-community-to-post",
  defineRoute(
    {
      roomId: { type: "string", required: true },
      communities: { type: "object", required: true },
      dryRun: { type: "boolean", required: true },
      testEmail: { type: "string", required: false },
    },
    async ({
      roomId,
      communities,
      dryRun,
      testEmail,
    }: { roomId: string; communities: string[]; dryRun: boolean; testEmail?: string }) => {
      if (!Array.isArray(communities) || communities.length === 0) {
        throw new Error("communities must be a non-empty array of community names");
      }

      const room = await getDebate(roomId);
      if (!room) {
        throw new Error(`Room ${roomId} not found`);
      }

      const statements = await getStatements(roomId);
      const { topStatements } = rankStatements(statements, MAX_TOP_STATEMENTS);
      const frontendUrl = getFrontendUrl();
      const subject = getCommunityPostInviteSubject(room.topic);
      const emailType = `${COMMUNITY_POST_INVITE_EMAIL_TYPE}:${roomId}`;

      let recipients: { id: string; email: string }[];
      let alreadyEmailed = 0;

      if (testEmail) {
        recipients = [{ id: "test", email: testEmail }];
      } else {
        const [allMemberships, sentEmails] = await Promise.all([
          getAllRecords<CommunityMembership>("subheard_member:"),
          getSentEmails(),
        ]);
        const alreadyEmailedUserIds = new Set(
          sentEmails.filter((e) => e.emailType === emailType).map((e) => e.userId),
        );
        const communitySet = new Set(communities);
        const memberIds = new Set(
          allMemberships
            .filter((m) => communitySet.has(m.subHeard))
            .map((m) => m.userId),
        );

        recipients = [];
        for (const userId of memberIds) {
          if (room.participants.includes(userId)) continue;
          if (alreadyEmailedUserIds.has(userId)) {
            alreadyEmailed++;
            continue;
          }
          const user = await getUser(userId);
          if (!user || !user.email) continue;
          if (user.emailDigestsEnabled === false) continue;
          if (user.isUnsubbedFromUpdates) continue;
          if (user.isTestUser) continue;
          recipients.push({ id: user.id, email: user.email });
        }
      }

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const recipient of recipients) {
        if (dryRun) {
          sent++;
          continue;
        }

        try {
          const html = generateCommunityPostInviteEmailHtml({
            room,
            topStatements,
            participantCount: room.participants.length,
            frontendUrl,
            userId: recipient.id,
          });

          const result = await sendEmailViaResend({ to: recipient.email, subject, html });
          if (result.success) {
            sent++;
            if (recipient.id !== "test") {
              await saveSentEmail({
                id: `${roomId}-${recipient.id}-${Date.now()}`,
                userId: recipient.id,
                sentAt: Date.now(),
                emailType,
              });
            }
          } else {
            failed++;
            errors.push(`${recipient.email}: ${result.error}`);
          }
        } catch (error) {
          failed++;
          errors.push(
            `${recipient.email}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const verb = dryRun ? "Would send" : "Sent";
      return {
        dryRun,
        roomId,
        topic: room.topic,
        communities,
        recipientCount: recipients.length,
        alreadyEmailed,
        sent,
        failed,
        errors,
        message: `${verb} ${sent} email(s) for "${room.topic}" to ${communities.join(", ")} members, ${alreadyEmailed} already emailed, ${failed} error(s)`,
      };
    },
    "Failed to run invite-community-to-post",
  ),
);

export { app as inviteCommunityToPostApi };
