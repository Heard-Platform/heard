import { getAllRealUsers } from "./db-utils.ts";
import { getSentEmails } from "./kv-utils.tsx";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

export const sendEmailViaResend = async (
  params: SendEmailParams,
): Promise<SendEmailResult> => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY not configured",
    };
  }

  try {
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
          to: [params.to],
          subject: params.subject,
          html: params.html,
        }),
      },
    );

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return {
        success: false,
        error: `Failed to send email: ${errorText}`,
      };
    }

    const result = await resendResponse.json();
    return {
      success: true,
      emailId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
};

export const getUsersToEmailWeeklyDigest = async () => {
  const now = Date.now();
  const allUsers = await getAllRealUsers();

  const cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
  const allSentEmails = await getSentEmails();
  const recentSentEmails = allSentEmails.filter(
    (email: any) =>
      email.sentAt >= cutoffTime && email.emailType === "weekly_digest",
  );
  const recentlyEmailedUserIds = new Set(
    recentSentEmails.map((email: any) => email.userId),
  );

  const isUserEligible = (user: any): boolean => {
    if (!user.email) return false;
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - ONE_WEEK;
    if (user.lastActive < oneWeekAgo) return false;
    return true;
  };

  const usersToConsider = allUsers.filter(
    (user: any) =>
      !recentlyEmailedUserIds.has(user.id) && isUserEligible(user),
  );

  return {
    allUsers,
    usersToConsider,
    recentlyEmailedUserIds,
    stats: {
      totalUsers: allUsers.length,
      eligibleUsers: usersToConsider.length,
      recentlyEmailedCount: recentlyEmailedUserIds.size,
    },
  };
};
