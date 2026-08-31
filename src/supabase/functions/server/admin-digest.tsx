import {
  getAllRealUsers,
  getAllVotes,
  getAllStatements,
  getAllRealDebates,
  getAllSubHeards,
  getSentEmails,
  SCRAPER_AUTHOR_IDS,
} from "./kv-utils.tsx";
import { selectAll } from "./db-utils.ts";
import { User, UserEvent, Community } from "./types.tsx";
import { getFrontendUrl, escapeHtml, truncate } from "./utils.tsx";

export interface AdminDigestListItem {
  title: string;
  url: string;
}

export interface AdminDailyStats {
  emailsSent: number;
  newSignups: number;
  uniqueSessions: number;
  anonymousSessions: number;
  signedInSessions: number;
  newVotes: number;
  newPosts: number;
  newStatements: number;
  newCommunities: number;
  newPostsList: AdminDigestListItem[];
  newStatementsList: AdminDigestListItem[];
  newCommunitiesList: AdminDigestListItem[];
  timePeriodHours: number;
}

export async function getAdminDailyStats(
  timePeriodMs: number = 24 * 60 * 60 * 1000
): Promise<AdminDailyStats> {
  const cutoffTime = Date.now() - timePeriodMs;
  const timePeriodHours = timePeriodMs / (60 * 60 * 1000);

  const [
    emailsSent,
    newSignups,
    sessionStats,
    newVotes,
    newPostsList,
    newStatementsList,
    newCommunitiesList,
  ] = await Promise.all([
    getEmailsSentSince(cutoffTime),
    getNewSignupsSince(cutoffTime),
    getSessionStatsSince(cutoffTime),
    getNewVotesSince(cutoffTime),
    getNewPostsSince(cutoffTime),
    getNewStatementsSince(cutoffTime),
    getNewCommunitiesSince(cutoffTime),
  ]);

  return {
    emailsSent,
    newSignups,
    uniqueSessions: sessionStats.total,
    anonymousSessions: sessionStats.anonymous,
    signedInSessions: sessionStats.signedIn,
    newVotes,
    newPosts: newPostsList.length,
    newStatements: newStatementsList.length,
    newCommunities: newCommunitiesList.length,
    newPostsList,
    newStatementsList,
    newCommunitiesList,
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

async function getNewSignupsSince(cutoffTime: number): Promise<number> {
  try {
    const allUsers = await getAllRealUsers();
    return allUsers.filter(
      (user: User) =>
        user.createdAt && user.createdAt >= cutoffTime && !user.isAnonymous
    ).length;
  } catch (error) {
    console.error("Error counting new signups:", error);
    return 0;
  }
}

async function getSessionStatsSince(
  cutoffTime: number
): Promise<{ total: number; anonymous: number; signedIn: number }> {
  try {
    const [pageLoadEvents, allUsers] = await Promise.all([
      selectAll<UserEvent>("user_events", { type: "initial_load" }, (q) =>
        q.gte("createdAt", new Date(cutoffTime).toISOString())
      ),
      getAllRealUsers(),
    ]);

    const userMap = new Map(allUsers.map((user) => [user.id, user]));

    let anonymous = 0;
    let signedIn = 0;

    for (const event of pageLoadEvents) {
      const user = event.userId ? userMap.get(event.userId) : undefined;
      if (event.userId && !user) continue;
      if (!user || user.isAnonymous) {
        anonymous++;
      } else {
        signedIn++;
      }
    }

    return { total: anonymous + signedIn, anonymous, signedIn };
  } catch (error) {
    console.error("Error counting sessions:", error);
    return { total: 0, anonymous: 0, signedIn: 0 };
  }
}

async function getNewVotesSince(cutoffTime: number): Promise<number> {
  try {
    const allVotes = await getAllVotes();
    return allVotes.filter((vote) => vote.timestamp >= cutoffTime).length;
  } catch (error) {
    console.error("Error counting new votes:", error);
    return 0;
  }
}

async function getNewPostsSince(cutoffTime: number): Promise<AdminDigestListItem[]> {
  try {
    const allRooms = await getAllRealDebates();
    return allRooms
      .filter((room) => room.createdAt >= cutoffTime && !SCRAPER_AUTHOR_IDS.has(room.hostId))
      .map((room) => ({ title: room.topic, url: `${getFrontendUrl()}/room/${room.id}` }));
  } catch (error) {
    console.error("Error listing new posts:", error);
    return [];
  }
}

async function getNewStatementsSince(cutoffTime: number): Promise<AdminDigestListItem[]> {
  try {
    const allStatements = await getAllStatements();
    return allStatements
      .filter(
        (statement) => statement.timestamp >= cutoffTime && !SCRAPER_AUTHOR_IDS.has(statement.author)
      )
      .map((statement) => ({
        title: statement.text,
        url: `${getFrontendUrl()}/room/${statement.roomId}?statement=${statement.id}`,
      }));
  } catch (error) {
    console.error("Error listing new statements:", error);
    return [];
  }
}

async function getNewCommunitiesSince(cutoffTime: number): Promise<AdminDigestListItem[]> {
  try {
    const allCommunities = await getAllSubHeards<Community & { createdAt: number }>();
    return allCommunities
      .filter((community) => community.createdAt >= cutoffTime)
      .map((community) => ({
        title: community.displayName || community.name,
        url: `${getFrontendUrl()}/h/${community.name}`,
      }));
  } catch (error) {
    console.error("Error listing new communities:", error);
    return [];
  }
}

export function generateAdminDigestHtml(stats: AdminDailyStats): string {
  const COLORS = {
    purple: "#667eea",
    purpleDark: "#5a67d8",
    gray: "#4a5568",
    grayLight: "#718096",
    bgLight: "#f7fafc",
    mutedValue: "#cbd5e0",
  };

  const GRADIENTS = {
    purple: "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);",
  };

  const metrics: Array<{ emoji: string; label: string; value: number }> = [
    { emoji: "👥", label: "Unique Sessions", value: stats.uniqueSessions },
    { emoji: "👤", label: "Signed-In Sessions", value: stats.signedInSessions },
    { emoji: "🏷️", label: "Anonymous Sessions", value: stats.anonymousSessions },
    { emoji: "✨", label: "New Signups", value: stats.newSignups },
    { emoji: "💬", label: "New Posts", value: stats.newPosts },
    { emoji: "📝", label: "New Statements", value: stats.newStatements },
    { emoji: "🗳️", label: "New Votes", value: stats.newVotes },
    { emoji: "🏠", label: "New Communities", value: stats.newCommunities },
    { emoji: "📧", label: "Emails Sent", value: stats.emailsSent },
  ];

  const metricRows = metrics
    .map((metric, index) => {
      const valueColor = metric.value === 0 ? COLORS.mutedValue : COLORS.purple;
      const border = index === metrics.length - 1 ? "" : "border-bottom: 1px solid #e2e8f0;";
      return `
              <tr>
                <td style="padding: 10px 0; color: ${COLORS.grayLight}; font-size: 14px; vertical-align: middle; ${border}">${metric.emoji} ${metric.label}</td>
                <td style="padding: 10px 0; text-align: right; vertical-align: middle; white-space: nowrap; ${border}">
                  <span style="color: ${valueColor}; font-size: 24px; font-weight: 700;">${metric.value}</span>
                </td>
              </tr>`;
    })
    .join("");

  const buildListSection = (
    heading: string,
    items: AdminDigestListItem[],
    emptyLabel: string
  ): string => {
    const rows = items.length
      ? items
          .map(
            (item, index) => `
              <tr>
                <td style="padding: 10px 0; ${index === items.length - 1 ? "" : "border-bottom: 1px solid #e2e8f0;"}">
                  <a href="${item.url}" style="color: ${COLORS.purple}; font-size: 14px; text-decoration: none;">${escapeHtml(truncate(item.title, 80))}</a>
                </td>
              </tr>`
          )
          .join("")
      : `
              <tr>
                <td style="padding: 10px 0; color: ${COLORS.mutedValue}; font-size: 14px;">${emptyLabel}</td>
              </tr>`;
    return `
          <div style="background: ${COLORS.bgLight}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 20px 0; color: ${COLORS.gray}; font-size: 18px;">${heading}</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              ${rows}
            </table>
          </div>`;
  };

  const listSections = [
    buildListSection("💬 New Posts", stats.newPostsList, "No new posts"),
    buildListSection("📝 New Statements", stats.newStatementsList, "No new statements"),
    buildListSection("🏠 New Communities", stats.newCommunitiesList, "No new communities"),
  ].join("");

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
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              ${metricRows}
            </table>
          </div>

          ${listSections}

          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <a href="https://heard.vote/admin" style="display: inline-block; ${GRADIENTS.purple} color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-bottom: 24px;">
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
