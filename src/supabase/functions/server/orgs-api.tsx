import { Hono } from "npm:hono";
import { insertOrgEmail } from "./model-utils.ts";
import { sendEmailToDevs } from "./dev-utils.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { isValidEmail } from "./validation-utils.ts";

export const orgsApi = new Hono();

orgsApi.post(
  "/make-server-f1a393b4/orgs/submit-email",
  defineRoute(
    {
      email: {
        type: 'string',
        required: true,
        validate: (value: string) => value.trim().length > 0 && isValidEmail(value),
        errorMessage: "Invalid email format",
      },
    },
    async ({ email }: { email: string }) => {
      const normalizedEmail = email.trim().toLowerCase();
      await insertOrgEmail(normalizedEmail);

      sendOrgSignupNotification(normalizedEmail).catch((error) =>
        console.error("Error sending org signup notification:", error)
      );

      return {};
    },
    "Failed to submit email"
  )
);

async function sendOrgSignupNotification(orgEmail: string) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .email-box {
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border: 2px solid #667eea;
            font-size: 18px;
            font-weight: 600;
            text-align: center;
            color: #667eea;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 New Org Pilot Program Signup</h1>
        </div>
        <div class="content">
          <p>Someone just signed up for the organizational pilot program!</p>
          
          <div class="email-box">
            ${orgEmail}
          </div>
          
          <p><strong>Next steps:</strong></p>
          <ul>
            <li>Review the organization's needs and use case</li>
            <li>Schedule an introductory call to discuss the platform</li>
            <li>Prepare demo materials and case studies</li>
          </ul>
          
          <p style="margin-top: 20px; color: #6b7280;">
            This notification was automatically sent when the email was submitted through the /orgs landing page.
          </p>
        </div>
        <div class="footer">
          <p>Heard - Making conversations count</p>
        </div>
      </body>
    </html>
  `;

  await sendEmailToDevs({
    from: "Heard Orgs <orgs@heard-now.com>",
    subject: `🎉 New Org Pilot Program Signup: ${orgEmail}`,
    html: emailHtml,
  });
}