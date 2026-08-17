import { Hono } from "npm:hono";
import { getDebate, getAllRealUsers, getParsedKvData, saveSentEmail } from "./kv-utils.tsx";
import { getStatements } from "./debate-api.tsx";
import { isEligibleEmailRecipient, sendEmailViaResend } from "./email-sender-utils.tsx";
import { getFrontendUrl } from "./utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { DebateRoom, Statement, User } from "./types.tsx";
import {
  NEW_STATEMENTS_EMAIL_TYPE,
  generateNewStatementsEmailHtml,
  getNewStatementsSubject,
} from "./email-new-statements-template.tsx";

const app = new Hono();

interface RoomContext {
  room: DebateRoom;
  statements: Statement[];
}

const loadRoomContext = async (roomId: string): Promise<RoomContext> => {
  const room = await getDebate(roomId);
  if (!room) {
    throw new Error(`Room ${roomId} not found`);
  }
  return { room, statements: await getStatements(roomId) };
};

const getUnvotedStatements = (
  statements: Statement[],
  userId: string,
): Statement[] =>
  statements.filter((s) => s.author !== userId && !s.voters[userId]);

interface PersonalizedEmail {
  subject: string;
  html: string;
  newStatementCount: number;
}

const buildNotificationEmail = async (
  room: DebateRoom,
  statements: Statement[],
  userId: string,
): Promise<PersonalizedEmail> => {
  const newStatements = getUnvotedStatements(statements, userId);
  return {
    subject: getNewStatementsSubject(room.topic, newStatements.length),
    html: await generateNewStatementsEmailHtml({
      room,
      statements: newStatements,
      frontendUrl: getFrontendUrl(),
      userId,
    }),
    newStatementCount: newStatements.length,
  };
};

const getEligibleRecipients = async (room: DebateRoom, statements: Statement[]) => {
  const allUsers = await getAllRealUsers();
  const usersById = new Map(allUsers.map((u) => [u.id, u]));
  const recipients: { id: string; email: string }[] = [];
  for (const userId of room.participants) {
    const user = usersById.get(userId);
    if (!isEligibleEmailRecipient(user)) continue;
    if (getUnvotedStatements(statements, userId).length === 0) continue;
    recipients.push({ id: user.id, email: user.email });
  }
  return recipients;
};

app.get(
  "/make-server-f1a393b4/notification/room/preview",
  defineRoute(
    {},
    async (_params, c) => {
      const roomId = c.req.query("roomId");
      if (!roomId) {
        throw new Error("roomId query parameter is required");
      }

      const userId = c.get("userId");
      const { room, statements } = await loadRoomContext(roomId);
      const { subject, html, newStatementCount } = await buildNotificationEmail(
        room,
        statements,
        userId,
      );
      const recipients = await getEligibleRecipients(room, statements);

      return {
        subject,
        html,
        newStatementCount,
        participantCount: room.participants.length,
        recipientCount: recipients.length,
      };
    },
    "Failed to generate notification preview",
  ),
);

app.post(
  "/make-server-f1a393b4/notification/room/send-test",
  defineRoute(
    {
      roomId: { type: "string", required: true },
    },
    async ({ roomId }: { roomId: string }, c) => {
      const userId = c.get("userId");

      const user = await getParsedKvData<User>(`user:${userId}`);
      if (!user || !user.email) {
        throw new Error("User not found or email not available");
      }

      const { room, statements } = await loadRoomContext(roomId);
      const { subject, html } = await buildNotificationEmail(room, statements, userId);

      const result = await sendEmailViaResend({ to: user.email, subject, html });
      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        message: `Test email sent to ${user.email}`,
        emailId: result.emailId,
      };
    },
    "Failed to send test notification email",
  ),
);

app.post(
  "/make-server-f1a393b4/notification/room/send",
  defineRoute(
    {
      roomId: { type: "string", required: true },
      dryRun: { type: "boolean", required: true },
    },
    async ({
      roomId,
      dryRun,
    }: { roomId: string; dryRun: boolean }) => {
      const { room, statements } = await loadRoomContext(roomId);
      const emailType = `${NEW_STATEMENTS_EMAIL_TYPE}:${roomId}`;
      const recipients = await getEligibleRecipients(room, statements);

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const recipient of recipients) {
        if (dryRun) {
          sent++;
          continue;
        }

        try {
          const { subject, html } = await buildNotificationEmail(
            room,
            statements,
            recipient.id,
          );
          const result = await sendEmailViaResend({ to: recipient.email, subject, html });
          if (result.success) {
            sent++;
            await saveSentEmail({
              id: `${roomId}-${recipient.id}-${Date.now()}`,
              userId: recipient.id,
              sentAt: Date.now(),
              emailType,
            });
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
        recipientCount: recipients.length,
        sent,
        failed,
        errors,
        message: `${verb} ${sent} email(s) for "${room.topic}" to ${recipients.length} recipient(s) with new statements to vote on, ${failed} error(s)`,
      };
    },
    "Failed to run notification room send",
  ),
);

export { app as notificationApi };
