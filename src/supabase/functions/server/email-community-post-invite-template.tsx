import type { DebateRoom, Statement } from "./types.tsx";
import { escapeHtml } from "./utils.tsx";
import { getTotalVoteCount, rankStatements } from "./statement-utils.tsx";

export const COMMUNITY_POST_INVITE_EMAIL_TYPE = "community_post_invite";

export const getCommunityPostInviteSubject = (topic: string): string => {
  return topic.length > 60 ? topic.substring(0, 60) + "..." : topic;
};

export interface CommunityPostInviteEmailData {
  room: DebateRoom;
  topAgree: Statement | null;
  topDisagree: Statement | null;
  mostSplit: Statement | null;
  participantCount: number;
  frontendUrl: string;
  userId: string;
}

const formatSubHeardDisplay = (name: string): string =>
  name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const PURPLE_GRADIENT =
  "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);";

const renderStatement = (
  s: Statement,
  accentColor: string,
  bgColor: string,
): string => {
  const total = getTotalVoteCount(s);
  return `
    <div style="background-color: ${bgColor}; border-left: 4px solid ${accentColor}; padding: 16px; margin-bottom: 12px; border-radius: 8px;">
      <div style="color: #2d3748; font-size: 15px; line-height: 1.5; margin-bottom: 10px;">"${escapeHtml(s.text)}"</div>
      <div style="color: #4a5568; font-size: 13px;">
        <span style="color: #48bb78; margin-right: 12px;">👍 ${s.agrees + s.superAgrees} agree</span>
        <span style="color: #f56565; margin-right: 12px;">👎 ${s.disagrees} disagree</span>
        <span style="color: #718096;">${total} votes</span>
      </div>
    </div>
  `;
};

const renderSection = (
  title: string,
  statement: Statement,
  accentColor: string,
  bgColor: string,
): string => `
  <div style="margin-bottom: 32px;">
    <h2 style="color: #030213; font-size: 20px; margin: 0 0 16px 0;">${title}</h2>
    ${renderStatement(statement, accentColor, bgColor)}
  </div>
`;

export const generateCommunityPostInviteEmailHtml = (
  data: CommunityPostInviteEmailData,
): string => {
  const { room, topAgree, topDisagree, mostSplit, participantCount, frontendUrl, userId } = data;

  const topicEscaped = escapeHtml(room.topic);
  const subHeard = room.subHeard;
  const subHeardDisplay = subHeard ? formatSubHeardDisplay(subHeard) : "";

  const topAgreeHtml = topAgree
    ? renderSection("👍 Most Agreed Response", topAgree, "#667eea", "#f8f9ff")
    : "";

  const topDisagreeHtml = topDisagree
    ? renderSection("👎 Most Disagreed Response", topDisagree, "#f5576c", "#fff5f7")
    : "";

  const mostSplitHtml = mostSplit
    ? renderSection("⚖️ Most Split Response", mostSplit, "#fa709a", "#fffbf0")
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to weigh in</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="${PURPLE_GRADIENT} color: #ffffff; padding: 40px 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Posted in ${escapeHtml(subHeardDisplay)}</p>
          <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">${topicEscaped}</h1>
        </div>

        <div style="padding: 32px 24px;">
          ${topAgreeHtml}

          ${topDisagreeHtml}

          ${mostSplitHtml}

          <div style="text-align: center;">
            <a href="${frontendUrl}/room/${room.id}" style="display: inline-block; ${PURPLE_GRADIENT} color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Join ${participantCount} Other${participantCount === 1 ? "" : "s"} Already Voting 💬
            </a>
          </div>
        </div>

        <div style="padding: 24px; text-align: center; color: #717182; font-size: 14px; background-color: #f8f9fa;">
          <p style="margin: 0 0 8px 0;">Heard - A Place to Be Heard</p>
          <p style="margin: 0; font-size: 12px;">
            <a href="${frontendUrl}/unsubscribe?userId=${userId}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateFakeCommunityPostInviteData = (
  frontendUrl: string,
): CommunityPostInviteEmailData => {
  const room: DebateRoom = {
    id: "preview-room-id",
    topic: "Should cities ban cars from downtown areas?",
    phase: "results",
    gameNumber: 1,
    roundStartTime: Date.now(),
    participants: ["u1", "u2", "u3", "u4", "u5", "u6", "u7"],
    hostId: "u1",
    isActive: true,
    createdAt: Date.now() - 60 * 60 * 1000,
    mode: "realtime",
    subHeard: "dupont-circle-neighborhoods",
  };

  const allStatements: Statement[] = [
    {
      id: "s1",
      text: "Pedestrian-only zones make downtowns more pleasant and boost local business.",
      author: "u2",
      agrees: 18,
      superAgrees: 7,
      disagrees: 3,
      passes: 1,
      roomId: room.id,
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "s2",
      text: "Cars are essential — banning them downtown will kill small business and isolate the elderly.",
      author: "u3",
      agrees: 3,
      superAgrees: 1,
      disagrees: 21,
      passes: 2,
      roomId: room.id,
      timestamp: Date.now(),
      round: 2,
      voters: {},
    },
    {
      id: "s3",
      text: "Charge a steep congestion fee instead of an outright ban.",
      author: "u4",
      agrees: 13,
      superAgrees: 2,
      disagrees: 14,
      passes: 1,
      roomId: room.id,
      timestamp: Date.now(),
      round: 3,
      voters: {},
    },
  ];

  const { topStatements, mostDisagreed, mostSplit } = rankStatements(allStatements, 1);

  return {
    room,
    topAgree: topStatements[0] ?? null,
    topDisagree: mostDisagreed,
    mostSplit,
    participantCount: room.participants.length,
    frontendUrl,
    userId: "preview-user",
  };
};
