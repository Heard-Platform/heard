import { sendEmailViaResend } from "./email-sender-utils.tsx";
import { escapeHtml, getRoomUrl } from "./utils.tsx";
import { buildStatementApprovalPageUrl } from "./statement-approval-utils.ts";
import { PURPLE_GRADIENT } from "./email-response-votes-notif-template.ts";
import type { DebateRoom, Statement, User } from "./types.tsx";

type EmailRoom = Pick<DebateRoom, "id" | "topic">;
type EmailStatement = Pick<Statement, "text">;
type EmailAuthor = Pick<User, "id" | "nickname">;

export const STATEMENT_APPROVAL_EMAIL_RECIPIENT = "alex@heard.vote";
export const STATEMENT_APPROVAL_EMAIL_TYPE = "statement_approval";

export const buildStatementApprovalEmailSubject = (
  room: EmailRoom,
): string => `✋ Statement awaiting approval: ${room.topic}`;

export const buildStatementApprovalEmailHtml = (
  room: EmailRoom,
  statement: EmailStatement,
  author: EmailAuthor,
): string => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>A statement needs your approval</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="${PURPLE_GRADIENT} color: #ffffff; padding: 40px 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">${escapeHtml(room.topic)}</p>
          <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">A statement needs your approval ✋</h1>
        </div>

        <div style="padding: 32px 24px;">
          <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 12px; border-radius: 8px;">
            <div style="color: #2d3748; font-size: 15px; line-height: 1.5;">${escapeHtml(statement.text)}</div>
          </div>
          <p style="margin: 0; color: #717182; font-size: 13px;">
            By ${escapeHtml(author.nickname)} (${escapeHtml(author.id)}) on
            <a href="${escapeHtml(getRoomUrl(room.id))}" style="color: #667eea; text-decoration: none;">the post</a>.
            Hidden until it's approved.
          </p>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${escapeHtml(buildStatementApprovalPageUrl())}" style="display: inline-block; ${PURPLE_GRADIENT} color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Review statements →
            </a>
          </div>
        </div>

        <div style="padding: 24px; text-align: center; color: #717182; font-size: 14px; background-color: #f8f9fa;">
          <p style="margin: 0;">Heard - A Place to Be Heard</p>
        </div>
      </div>
    </body>
    </html>
  `;

export const notifyOfStatementAwaitingApproval = async (
  room: DebateRoom,
  statement: Statement,
  author: User,
): Promise<void> => {
  try {
    const result = await sendEmailViaResend({
      to: STATEMENT_APPROVAL_EMAIL_RECIPIENT,
      subject: buildStatementApprovalEmailSubject(room),
      html: buildStatementApprovalEmailHtml(room, statement, author),
    });
    if (!result.success) {
      console.error(
        `[statement-approval] Failed to send: ${result.error}`,
      );
    }
  } catch (error) {
    console.error("[statement-approval] Failed to notify:", error);
  }
};

export const buildFakeStatementApprovalEmail = (): {
  subject: string;
  html: string;
} => {
  const room: EmailRoom = {
    id: "preview-room",
    topic: "Is a hot dog a sandwich?",
  };
  const statement: EmailStatement = {
    text: "A hot dog is a taco and I will not be taking questions.",
  };
  const author: EmailAuthor = {
    id: "preview-user",
    nickname: "MustardMaximalist",
  };
  return {
    subject: buildStatementApprovalEmailSubject(room),
    html: buildStatementApprovalEmailHtml(room, statement, author),
  };
};
