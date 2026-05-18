import { Context, Hono } from "npm:hono";
import { insertUserReport } from "./model-utils.ts";
import { NewUserReport, Statement, User } from "./types.tsx";
import { getStatement, getUser } from "./kv-utils.tsx";
import { sendEmailToDevs } from "./dev-utils.tsx";
import { escapeHtml } from "./utils.tsx";

const app = new Hono();

app.post(
  "/make-server-f1a393b4/statement/:statementId/flag",
  async (c: Context) => {
    try {
      const userId = c.get("userId");
      const statementId = c.req.param("statementId");
      const { roomId, reason } = await c.req.json();

      if (!roomId || !statementId) {
        return c.json(
          { error: "roomId and statementId are required" },
          400,
        );
      }

      const trimmedReason = reason.trim();

      const report: NewUserReport = {
        responseId: statementId,
        reportingUserId: userId,
        reason: trimmedReason,
      };

      const result = await insertUserReport(report);

      if (!result.success) {
        return c.json(
          { error: result.error || "Failed to flag statement" },
          500,
        );
      }

      try {
        const [statement, reportingUser] = await Promise.all([
          getStatement(statementId),
          userId ? getUser(userId) : Promise.resolve(null),
        ]);
        await sendReportEmail({
          statement,
          reportingUser,
          statementId,
          roomId,
          reportingUserId: userId,
          reason: trimmedReason,
        });
      } catch (emailError) {
        console.error("Failed to send report email:", emailError);
      }

      return c.json({ success: true });
    } catch (error) {
      console.error("Error flagging statement:", error);
      return c.json(
        { error: "Failed to flag statement" },
        500,
      );
    }
  },
);

async function sendReportEmail({
  statement,
  reportingUser,
  statementId,
  roomId,
  reportingUserId,
  reason,
}: {
  statement: Statement | null;
  reportingUser: User | null;
  statementId: string;
  roomId: string;
  reportingUserId: string | undefined;
  reason: string;
}) {
  const statementText = statement?.text ?? "(statement not found)";
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
        <title>Statement Reported - Heard</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e53935 0%, #b71c1c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚩 Statement Reported</h1>
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
              <strong>Statement ID:</strong> ${escapeHtml(statementId)}
            </p>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>Time:</strong> ${new Date().toISOString()}
            </p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #e53935;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Reported statement:</h2>
            <p style="margin: 0; white-space: pre-wrap; font-size: 16px; line-height: 1.8;">
              ${escapeHtml(statementText)}
            </p>
          </div>
          ${reasonBlock}
        </div>
      </body>
    </html>
  `;

  const preview = statementText.substring(0, 50);
  await sendEmailToDevs({
    from: "Heard Reports <hello@heard-now.com>",
    subject: `🚩 Statement reported: "${preview}${statementText.length > 50 ? "..." : ""}"`,
    html: emailHtml,
  });
}

export { app as reportingApi };
