import { getDevUsers } from "./kv-utils.tsx";
import { escapeHtml } from "./utils.tsx";

export async function getDevEmails(): Promise<string[]> {
  const devUsers = await getDevUsers();
  const devEmails = devUsers
    .filter(user => user.email)
    .map(user => user.email);
  
  return devEmails;
}

interface EmailSection {
  heading: string;
  body: string;
  borderColor?: string;
}

export function buildDevAlertEmailHtml({
  title,
  gradientFrom,
  gradientTo,
  metadata,
  sections,
}: {
  title: string;
  gradientFrom: string;
  gradientTo: string;
  metadata: { label: string; value: string }[];
  sections: EmailSection[];
}): string {
  const metadataHtml = metadata
    .map(
      ({ label, value }) => `
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}
            </p>`,
    )
    .join("");

  const sectionsHtml = sections
    .map(
      ({ heading, body, borderColor = gradientFrom }) => `
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${borderColor}; margin-top: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">${escapeHtml(heading)}:</h2>
            <p style="margin: 0; white-space: pre-wrap; font-size: 16px; line-height: 1.8;">
              ${escapeHtml(body)}
            </p>
          </div>`,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(title)} - Heard</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${escapeHtml(title)}</h1>
        </div>

        <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            ${metadataHtml}
          </div>
          ${sectionsHtml}
        </div>
      </body>
    </html>
  `;
}

interface SendEmailToDevsOptions {
  from: string;
  subject: string;
  html: string;
}

export async function sendEmailToDevs({ from, subject, html }: SendEmailToDevsOptions): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not found in environment variables");
    return;
  }

  const devEmails = await getDevEmails();
  
  if (devEmails.length === 0) {
    console.log("No dev users found to send email to");
    return;
  }

  for (const devEmail of devEmails) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [devEmail],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Failed to send email to ${devEmail}:`, errorData);
      } else {
        console.log(`Email sent successfully to ${devEmail}`);
      }
    } catch (error) {
      console.error(`Error sending email to ${devEmail}:`, error);
    }
  }
}
