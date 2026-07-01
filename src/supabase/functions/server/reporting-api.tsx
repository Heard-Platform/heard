import { Context, Hono } from "npm:hono";
import { insertUserReport } from "./model-utils.ts";
import { NewUserReport, User } from "./types.tsx";
import { getAskTheDataRecord, getStatement, getUser } from "./kv-utils.tsx";
import { sendEmailToDevs } from "./dev-utils.tsx";
import { escapeHtml } from "./utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";

const app = new Hono();

type ReportedContentType = "statement" | "ask-the-data";

app.post(
  "/make-server-f1a393b4/report",
  defineRoute(
    {
      type: {
        type: "string",
        required: true,
        validate: (value: string) => value === "statement" || value === "ask-the-data",
        errorMessage: "type must be 'statement' or 'ask-the-data'",
      },
      targetId: { type: "string", required: true },
      roomId: { type: "string", required: true },
      reason: { type: "string", required: false },
    },
    async (
      { type, targetId, roomId, reason }: {
        type: ReportedContentType;
        targetId: string;
        roomId: string;
        reason?: string;
      },
      c: Context,
    ) => {
      const userId = c.get("userId");
      const trimmedReason = (reason ?? "").trim();

      const report: NewUserReport = {
        responseId: targetId,
        reportingUserId: userId,
        reason: trimmedReason,
      };

      const result = await insertUserReport(report);

      if (!result.success) {
        throw new Error(result.error || "Failed to flag content");
      }

      try {
        const [content, reportingUser] = await Promise.all([
          getReportedContent(type, targetId),
          userId ? getUser(userId) : Promise.resolve(null),
        ]);
        await sendReportEmail({
          content,
          reportingUser,
          targetId,
          roomId,
          reportingUserId: userId,
          reason: trimmedReason,
        });
      } catch (emailError) {
        console.error("Failed to send report email:", emailError);
      }

      return {};
    },
    "Failed to flag content",
  ),
);

async function getReportedContent(
  type: ReportedContentType,
  targetId: string,
): Promise<{ heading: string; body: string }> {
  if (type === "statement") {
    const statement = await getStatement(targetId);
    return {
      heading: "Reported statement",
      body: statement?.text ?? "(statement not found)",
    };
  }

  const record = await getAskTheDataRecord(targetId);
  return {
    heading: "Ask the Data response",
    body: record
      ? `Q: ${record.question}\n\nA: ${record.answer}`
      : "(response not found)",
  };
}

async function sendReportEmail({
  content,
  reportingUser,
  targetId,
  roomId,
  reportingUserId,
  reason,
}: {
  content: { heading: string; body: string };
  reportingUser: User | null;
  targetId: string;
  roomId: string;
  reportingUserId: string | undefined;
  reason: string;
}) {
  const reporterLabel = reportingUser
    ? `${reportingUser.nickname || "Unknown"}${reportingUser.email ? ` (${reportingUser.email})` : ""}`
    : reportingUserId
      ? `User ID: ${reportingUserId}`
      : "Anonymous";

  const reasonBlock = reason
    ? `
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1976d2; margin-top: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Reporter's reason:</h2>
            <p style="margin: 0; white-space: pre-wrap; font-size: 16px; line-height: 1.8;">
              ${escapeHtml(reason)}
            </p>
          </div>`
    : "";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Content Reported - Heard</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e53935 0%, #b71c1c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚩 Content Reported</h1>
        </div>

        <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>Reported by:</strong> ${escapeHtml(reporterLabel)}
            </p>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>Room ID:</strong> ${escapeHtml(roomId)}
            </p>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>Target ID:</strong> ${escapeHtml(targetId)}
            </p>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>Time:</strong> ${new Date().toISOString()}
            </p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #e53935;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">${escapeHtml(content.heading)}:</h2>
            <p style="margin: 0; white-space: pre-wrap; font-size: 16px; line-height: 1.8;">
              ${escapeHtml(content.body)}
            </p>
          </div>
          ${reasonBlock}
        </div>
      </body>
    </html>
  `;

  const normalizedBody = content.body.replace(/\s+/g, " ").trim();
  const preview = normalizedBody.substring(0, 50);
  await sendEmailToDevs({
    from: "Heard Reports <hello@heard-now.com>",
    subject: `🚩 ${content.heading} reported: "${preview}${normalizedBody.length > 50 ? "..." : ""}"`,
    html: emailHtml,
  });
}

export { app as reportingApi };
