import { Hono } from "npm:hono@4";
import * as kvUtils from "./kv-utils.tsx";
import { generateRealEmailData, hasEmailContent } from "./email-digest-data-generator.tsx";
import type { UserSession } from "./types.tsx";
import {
  EmailData
} from "./email-types.ts";
import { generateEmailHtml, generateFakeData } from "./email-digest-template.tsx";
import { sendEmailViaResend, getUsersToEmailWeeklyDigest } from "./email-sender-utils.tsx";

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

      const sendResult = await sendEmailViaResend({
        to: user.email,
        subject: "🎯 The Latest on Heard",
        html: emailHtml,
      });

      if (!sendResult.success) {
        console.log(
          `Error sending email via Resend: ${sendResult.error}`,
        );
        return c.json(
          { error: sendResult.error },
          500,
        );
      }

      console.log(
        `Test email sent successfully to ${user.email}`,
        sendResult.emailId,
      );

      return c.json({
        success: true,
        message: `Test email sent to ${user.email}`,
        emailId: sendResult.emailId,
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

app.get(
  "/make-server-f1a393b4/dev/email-previews/count",
  async (c) => {
    try {
      const sinceTimestamp = c.req.query("sinceTimestamp");

      if (!sinceTimestamp) {
        return c.json(
          { error: "sinceTimestamp query parameter is required" },
          400,
        );
      }

      console.log(`[email-count] Calculating eligible users since ${sinceTimestamp}`);

      const timestamp = parseInt(sinceTimestamp, 10);

      const { usersToConsider, stats } = await getUsersToEmailWeeklyDigest();
      
      console.log(`[email-count] ${stats.totalUsers} total users`);
      console.log(`[email-count] ${stats.recentlyEmailedCount} users recently emailed`);
      console.log(`[email-count] ${stats.eligibleUsers} eligible users to consider`);

      let eligibleCount = 0;
      const eligibleUsers: Array<{ email: string; nickname: string; id: string }> = [];
      const consideredUsers: Array<{ email: string; nickname: string; id: string }> = [];

      for (const user of usersToConsider) {
        const userInfo = { email: user.email, nickname: user.nickname, id: user.id };
        consideredUsers.push(userInfo);
        
        try {
          const emailData = await generateRealEmailData(user.id, timestamp);
          
          if (hasEmailContent(emailData)) {
            eligibleCount++;
            eligibleUsers.push(userInfo);
          }
        } catch (error) {
          console.log(`[email-count] Error checking user ${user.id}:`, error);
        }
      }

      console.log(`[email-count] ${eligibleCount}/${usersToConsider.length} users have content`);

      return c.json({
        success: true,
        eligibleCount,
        totalCount: stats.totalUsers,
        consideredCount: stats.eligibleUsers,
        recentlyEmailedCount: stats.recentlyEmailedCount,
        sinceTimestamp: timestamp,
        eligibleUsers,
        consideredUsers,
      });
    } catch (error) {
      console.log("[email-count] Error:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unknown error calculating count",
        },
        500,
      );
    }
  },
);

export { app as emailPreviewsApi };