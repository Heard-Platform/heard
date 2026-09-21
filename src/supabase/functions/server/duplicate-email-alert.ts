import { getDevUsers } from "./kv-utils.tsx";
import { sendEmailViaResend } from "./email-sender-utils.tsx";
import { escapeHtml } from "./utils.tsx";
import type { User } from "./types.tsx";

export const DUPLICATE_ACCOUNT_ERROR =
  "An account already exists with this email. Our team has been notified of this possible duplicate account issue and will look into it.";

export const DUPLICATE_EMAIL_ALERT_SUBJECT =
  "⚠️ Possible duplicate account: email already in use";

export const buildDuplicateEmailAlertHtml = (
  attemptingUser: User | null,
  existingUser: User,
  attemptedEmail: string,
  now: number,
): string => {
  const phoneSuffix = attemptingUser?.phoneNumber?.slice(-4);
  const rows: [string, string][] = [
    ["Time", new Date(now).toISOString()],
    ["Email they tried to add", attemptedEmail],
    ["User trying to add it", attemptingUser?.id ?? "unknown"],
    ["Their nickname", attemptingUser?.nickname ?? "unknown"],
    ["Their phone (last 4)", phoneSuffix ?? "none"],
    ["Existing account with that email", existingUser.id],
    ["Existing account nickname", existingUser.nickname],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding: 4px 16px 4px 0; color: #717182;">${escapeHtml(label)}</td><td style="padding: 4px 0;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px;">
      <h2>Possible duplicate account</h2>
      <p>A user without an email tried to add one that already belongs to another account. They were shown an error telling them the team has been notified.</p>
      <table>${rowsHtml}</table>
    </div>
  `;
};

export const notifyDevsOfDuplicateEmail = async (
  attemptingUser: User | null,
  existingUser: User,
  attemptedEmail: string,
): Promise<void> => {
  try {
    const html = buildDuplicateEmailAlertHtml(
      attemptingUser,
      existingUser,
      attemptedEmail,
      Date.now(),
    );
    const devUsers = (await getDevUsers()).filter((dev) => dev.email);

    await Promise.all(
      devUsers.map(async (dev) => {
        const result = await sendEmailViaResend({
          to: dev.email,
          subject: DUPLICATE_EMAIL_ALERT_SUBJECT,
          html,
        });
        if (!result.success) {
          console.error(
            `[duplicate-email-alert] Failed to send to ${dev.id}: ${result.error}`,
          );
        }
      }),
    );
  } catch (error) {
    console.error("[duplicate-email-alert] Failed to notify devs:", error);
  }
};
