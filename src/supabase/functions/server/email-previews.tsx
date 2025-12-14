import { Hono } from "npm:hono";
import * as kvUtils from "./kv-utils.tsx";
import { generateRealEmailData, hasEmailContent } from "./email-digest-data-generator.tsx";
import type { UserSession } from "./types.tsx";
import {
  EmailData
} from "./email-types.ts";
import { generateEmailHtml, generateFakeData } from "./email-digest-template.tsx";

const app = new Hono();

app.get(
  "/make-server-f1a393b4/dev/email-previews",
  async (c) => {
    const userId = c.req.query("userId");
    const sinceTimestamp = c.req.query("sinceTimestamp");

    console.log(
      `[email-previews GET] Received request with userId: ${userId || "none (will use mock data)"}, sinceTimestamp: ${sinceTimestamp}`,
    );

    let emailData: EmailData;
    if (userId) {
      if (!sinceTimestamp) {
        return c.json(
          {
            error: "sinceTimestamp query parameter is required",
          },
          400,
        );
      }

      console.log(
        `[email-previews GET] Generating real data for userId: ${userId}`,
      );
      const timestamp = parseInt(sinceTimestamp, 10);
      emailData = await generateRealEmailData(
        userId,
        timestamp,
      );
    } else {
      console.log(`[email-previews GET] Generating mock data`);
      emailData = generateFakeData();
    }

    const hasContent = hasEmailContent(emailData);
    console.log(
      `[email-previews GET] Email has content: ${hasContent}`,
    );
    console.log(`[email-previews GET] Data summary:`, {
      conversationsStarted:
        emailData.conversationsStarted.length,
      takesPosted: emailData.takesPosted.length,
      conversationsParticipated:
        emailData.conversationsParticipated.length,
      communities: emailData.communities.length,
    });

    const emailHtml = generateEmailHtml(emailData);
    return c.html(emailHtml);
  },
);

app.post(
  "/make-server-f1a393b4/dev/email-previews/send",
  async (c) => {
    try {
      const body = await c.req.json();
      const { userId, useMockData, sinceTimestamp } = body;

      if (!userId) {
        return c.json({ error: "User ID is required" }, 400);
      }

      const user = await kvUtils.getParsedKvData<UserSession>(
        `user:${userId}`,
      );
      if (!user || !user.email) {
        return c.json(
          { error: "User not found or email not available" },
          404,
        );
      }

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.log(
          "Error sending test email: RESEND_API_KEY not configured",
        );
        return c.json(
          { error: "Email service not configured" },
          500,
        );
      }

      let emailData: EmailData;
      if (useMockData) {
        emailData = generateFakeData();
      } else {
        emailData = await generateRealEmailData(
          userId,
          sinceTimestamp,
        );
      }

      if (!hasEmailContent(emailData)) {
        return c.json(
          {
            error: "No content to send",
            message:
              "User has no activity to include in the email",
          },
          400,
        );
      }

      const emailHtml = generateEmailHtml(emailData);

      const resendResponse = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Heard <updates@heard-now.com>",
            to: [user.email],
            subject: "🎯 The Latest on Heard",
            html: emailHtml,
          }),
        },
      );

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.log(
          `Error sending email via Resend: ${resendResponse.status} - ${errorText}`,
        );
        return c.json(
          { error: `Failed to send email: ${errorText}` },
          500,
        );
      }

      const result = await resendResponse.json();
      console.log(
        `Test email sent successfully to ${user.email}`,
        result,
      );

      return c.json({
        success: true,
        message: `Test email sent to ${user.email}`,
        emailId: result.id,
      });
    } catch (error) {
      console.log("Error sending test email:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unknown error sending email",
        },
        500,
      );
    }
  },
);

export { app as emailPreviewsApi };