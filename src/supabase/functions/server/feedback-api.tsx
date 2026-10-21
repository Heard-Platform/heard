// @ts-ignore
import { Context, Hono } from "npm:hono";
import { saveFeedback } from "./kv-utils.tsx";
import { sendEmailToDevs } from "./dev-utils.tsx";
import { getAppFeedbackVotesForUser, saveAppFeedbackVote } from "./model-utils.ts";
import {
  type AppFeedbackStatementKey,
  FEEDBACK_CARD_NOTE_SOURCE,
  isAppFeedbackStatementKey,
  isVoteType,
} from "./feedback-utils.ts";
import { defineRoute } from "./route-wrapper.tsx";
import type { VoteType } from "./types.tsx";

const app = new Hono();

// Submit feedback
app.post("/make-server-f1a393b4/feedback/submit", async (c: Context) => {
  try {
    const userId = c.get("userId");
    const { feedbackText, statementKey, roomId } = await c.req.json();

    if (!feedbackText || !feedbackText.trim()) {
      return c.json({ error: "Feedback text is required" }, 400);
    }

    const feedbackId = crypto.randomUUID();
    const timestamp = Date.now();

    const feedback = {
      id: feedbackId,
      userId: userId || "no-account",
      text: feedbackText.trim(),
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      ...(isAppFeedbackStatementKey(statementKey) && {
        source: FEEDBACK_CARD_NOTE_SOURCE,
        statementKey,
        roomId: typeof roomId === "string" ? roomId : null,
      }),
    };

    // Store in KV store
    await saveFeedback(feedback);

    // Send email to dev users
    try {
      await sendFeedbackEmail(feedback);
    } catch (emailError) {
      console.error("Failed to send feedback email:", emailError);
    }

    return c.json({
      success: true,
      feedbackId,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return c.json(
      { error: "Failed to submit feedback" },
      500,
    );
  }
});

app.get(
  "/make-server-f1a393b4/feedback/cards/voted",
  defineRoute(
    {},
    async (_params, c) => {
      const votes = await getAppFeedbackVotesForUser(c.get("userId"));
      return { votedFeedback: votes.map(({ statementKey, votedAt }) => ({ statementKey, votedAt })) };
    },
    "Failed to fetch voted feedback",
  ),
);

app.post(
  "/make-server-f1a393b4/feedback/cards/vote",
  defineRoute<{ statementKey: AppFeedbackStatementKey; vote: VoteType; roomId: string }, void>(
    {
      statementKey: {
        type: "string",
        required: true,
        validate: isAppFeedbackStatementKey,
        errorMessage: "statementKey must be a known feedback statement",
      },
      vote: {
        type: "string",
        required: true,
        validate: isVoteType,
        errorMessage: "vote must be agree, disagree, pass or super_agree",
      },
      roomId: {
        type: "string",
        required: true,
        validate: (roomId: string) => roomId.length > 0,
      },
    },
    async ({ statementKey, vote, roomId }, c) => {
      const result = await saveAppFeedbackVote({
        userId: c.get("userId"),
        statementKey,
        vote,
        roomId,
        votedAt: Date.now(),
      });
      if (!result.success) throw new Error(result.error);
    },
    "Failed to save feedback card vote",
  ),
);

async function sendFeedbackEmail(feedback: any) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Feedback - Heard</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💜 New Feedback Received!</h1>
        </div>
        
        <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>From:</strong> ${feedback.userId === "anonymous" ? "Anonymous User" : `User ID: ${feedback.userId}`}
            </p>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>Time:</strong> ${feedback.createdAt}
            </p>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>Feedback ID:</strong> ${feedback.id}
            </p>${feedback.statementKey ? `
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>Feedback card:</strong> ${feedback.statementKey}
            </p>` : ""}
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Feedback:</h2>
            <p style="margin: 0; white-space: pre-wrap; font-size: 16px; line-height: 1.8;">
              ${feedback.text}
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Keep building awesome stuff! 🚀</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmailToDevs({
    from: "Heard Feedback <alex@heard.vote>",
    subject: `💜 New Heard Feedback: "${feedback.text.substring(0, 50)}${feedback.text.length > 50 ? "..." : ""}"`,
    html: emailHtml,
  });
}

export { app as feedbackApi };