// @ts-ignore
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getDevUsers } from "./kv-utils.tsx";
import { validateSession } from "./auth-utils.ts";
import { validateDeveloper } from "./internal-utils.ts";

const app = new Hono();

// Submit feedback
app.post("/make-server-f1a393b4/feedback/submit", validateSession, async (c) => {
  try {
    const { userId, feedbackText } = await c.req.json();

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
      // Don't fail the request if email fails
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

app.get("/make-server-f1a393b4/feedback/list", validateDeveloper, async (c) => {
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
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not found in environment variables");
    return;
  }

  // Get all dev users
  const devEmails = await getDevEmails();
  
  if (devEmails.length === 0) {
    console.log("No dev users found to send feedback email to");
    return;
  }

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

  // Send email to all dev users
  for (const devEmail of devEmails) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Heard Feedback <feedback@heard-now.com>",
          to: [devEmail],
          subject: `💜 New Heard Feedback: "${feedback.text.substring(0, 50)}${feedback.text.length > 50 ? "..." : ""}"`,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Failed to send email to ${devEmail}:`, errorData);
      } else {
        console.log(`Feedback email sent successfully to ${devEmail}`);
      }
    } catch (error) {
      console.error(`Error sending email to ${devEmail}:`, error);
    }
  }
}

async function getDevEmails(): Promise<string[]> {
  try {
    const devUsers = await getDevUsers();
    const devEmails = devUsers
      .filter(user => user.email)
      .map(user => user.email);
    
    // If we found dev users, return their emails
    if (devEmails.length > 0) {
      return devEmails;
    }
    
    // Default dev email if no developers found
    return ["dev@heard-now.com"];
  } catch (error) {
    console.error("Error getting dev users:", error);
    return ["dev@heard-now.com"];
  }
}

export { app as feedbackApi };