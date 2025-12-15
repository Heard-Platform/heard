import * as kv from "./kv_store.tsx";
import { getAllRealUsers, getSentEmails } from "./kv-utils.tsx";
import type { UserSession, Vote, Statement, DebateRoom } from "./types.tsx";

export interface AdminDailyStats {
  emailsSent: number;
  newUsers: number;
  timePeriodHours: number;
}

export async function getAdminDailyStats(
  timePeriodMs: number = 24 * 60 * 60 * 1000
): Promise<AdminDailyStats> {
  const cutoffTime = Date.now() - timePeriodMs;
  const timePeriodHours = timePeriodMs / (60 * 60 * 1000);

  const [emailsSent, newUsers] = await Promise.all([
    getEmailsSentSince(cutoffTime),
    getNewUsersSince(cutoffTime),
  ]);

  return {
    emailsSent,
    newUsers,
    timePeriodHours,
  };
}

async function getEmailsSentSince(cutoffTime: number): Promise<number> {
  try {
    const allEmails = await getSentEmails();
    return allEmails.filter((email: any) => email.sentAt >= cutoffTime).length;
  } catch (error) {
    console.error("Error counting emails sent:", error);
    return 0;
  }
}

async function getNewUsersSince(cutoffTime: number): Promise<number> {
  try {
    const allUsers = await getAllRealUsers();
    return allUsers.filter((user: UserSession) => 
      user.createdAt && user.createdAt >= cutoffTime
    ).length;
  } catch (error) {
    console.error("Error counting new users:", error);
    return 0;
  }
}

export function generateAdminDigestHtml(stats: AdminDailyStats): string {
  const COLORS = {
    purple: "#667eea",
    purpleDark: "#5a67d8",
    gray: "#4a5568",
    grayLight: "#718096",
    bgLight: "#f7fafc",
  };

  const GRADIENTS = {
    purple: "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);",
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Heard Admin Daily Digest</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.bgLight};">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          
          <h1 style="margin: 0 0 8px 0; color: ${COLORS.gray}; font-size: 28px;">📊 Daily Admin Digest</h1>
          <p style="margin: 0 0 32px 0; color: ${COLORS.grayLight}; font-size: 14px;">
            Stats for the past ${stats.timePeriodHours} hours
          </p>

          <div style="background: ${COLORS.bgLight}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 20px 0; color: ${COLORS.gray}; font-size: 18px;">Key Metrics</h2>
            
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="color: ${COLORS.grayLight}; font-size: 14px;">📧 Emails Sent</span>
                <span style="color: ${COLORS.purple}; font-size: 24px; font-weight: 700;">${stats.emailsSent}</span>
              </div>
            </div>

            <div style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: ${COLORS.grayLight}; font-size: 14px;">👤 New Users</span>
                <span style="color: ${COLORS.purple}; font-size: 24px; font-weight: 700;">${stats.newUsers}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <a href="https://heard-now.com/admin" style="display: inline-block; ${GRADIENTS.purple} color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-bottom: 24px;">
              View Admin Panel 🔧
            </a>
            <p style="margin: 0 0 8px 0;">Heard - Admin Dashboard</p>
            <p style="margin: 0; font-size: 12px; color: ${COLORS.grayLight};">
              Daily digest for developers
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}