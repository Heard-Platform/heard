// @ts-ignore
import * as kv from "./kv_store.tsx";
import { sendEmailToDevs } from "./dev-utils.tsx";
import { AuthedHono } from "./hono-wrapper.ts";
import { Context } from "npm:hono";

const authedApp = new AuthedHono();

// Submit feedback
authedApp.post("/make-server-f1a393b4/feedback/submit", async (c: Context) => {
  try {
    const { feedbackText } = await c.req.json();
    const userId = c.get("userId");

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
    };

    // Store in KV store
    await kv.set(`feedback:${feedbackId}`, JSON.stringify(feedback));

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

authedApp.get("/make-server-f1a393b4/feedback/list", async (c) => {
  try {
    const feedbackKeys = await kv.getByPrefix("feedback:");

    const feedbackList = feedbackKeys
      .map((fb) => {
        try {
          return typeof fb === "string" ? JSON.parse(fb) : fb;
        } catch (error) {
          return null;
        }
      })
      .filter((fb) => fb !== null);

    // Sort by most recent
    feedbackList.sort((a, b) => b.timestamp - a.timestamp);

    return c.json({ feedback: feedbackList });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return c.json({ error: "Failed to fetch feedback" }, 500);
  }
});

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
            </p>
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
    from: "Heard Feedback <feedback@heard-now.com>",
    subject: `💜 New Heard Feedback: "${feedback.text.substring(0, 50)}${feedback.text.length > 50 ? "..." : ""}"`,
    html: emailHtml,
  });
}

export { authedApp as feedbackApi };