import { Context, Hono } from "npm:hono";
import { insertUserReport } from "./model-utils.ts";
import { NewUserReport, User } from "./types.tsx";
import { getAskTheDataRecord, getStatement, getUser } from "./kv-utils.tsx";
import { buildDevAlertEmailHtml, sendEmailToDevs } from "./dev-utils.tsx";
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

  const emailHtml = buildDevAlertEmailHtml({
    title: "🚩 Content Reported",
    gradientFrom: "#e53935",
    gradientTo: "#b71c1c",
    metadata: [
      { label: "Reported by", value: reporterLabel },
      { label: "Room ID", value: roomId },
      { label: "Target ID", value: targetId },
      { label: "Time", value: new Date().toISOString() },
    ],
    sections: [
      { heading: content.heading, body: content.body },
      ...(reason
        ? [{ heading: "Reporter's reason", body: reason, borderColor: "#1976d2" }]
        : []),
    ],
  });

  const normalizedBody = content.body.replace(/\s+/g, " ").trim();
  const preview = normalizedBody.substring(0, 50);
  await sendEmailToDevs({
    from: "Heard Reports <hello@heard-now.com>",
    subject: `🚩 ${content.heading} reported: "${preview}${normalizedBody.length > 50 ? "..." : ""}"`,
    html: emailHtml,
  });
}

export { app as reportingApi };
