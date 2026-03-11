import { getDevUsers } from "./kv-utils.tsx";

export async function getDevEmails(): Promise<string[]> {
  const devUsers = await getDevUsers();
  const devEmails = devUsers
    .filter(user => user.email)
    .map(user => user.email);
  
  return devEmails;
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
