import type { DebateRoom, Statement } from "./types.tsx";
import { escapeHtml } from "./utils.tsx";
import { getTotalVoteCount, rankStatements } from "./statement-utils.tsx";
import { renderStatementText } from "./email-statement-text.tsx";

export const DEBATE_ENDED_EMAIL_TYPE = "debate_ended";

export const getDebateEndedSubject = (topic: string): string => {
  const trimmed = topic.length > 60 ? topic.substring(0, 60) + "..." : topic;
  return `${trimmed} — The results are in!`;
};

export interface OtherConvo {
  id: string;
  topic: string;
  participantCount: number;
}

export interface DebateEndedEmailData {
  room: DebateRoom;
  topStatements: Statement[];
  mostDisagreed: Statement | null;
  mostSplit: Statement | null;
  totalVotes: number;
  participantCount: number;
  otherConvos: OtherConvo[];
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

const renderStatement = async (
  s: Statement,
  accentColor: string,
  bgColor: string,
): Promise<string> => {
  const total = getTotalVoteCount(s);
  const body = await renderStatementText(s.text);
  return `
    <div style="background-color: ${bgColor}; border-left: 4px solid ${accentColor}; padding: 16px; margin-bottom: 12px; border-radius: 8px;">
      <div style="color: #2d3748; font-size: 15px; line-height: 1.5; margin-bottom: 10px;">${body}</div>
      <div style="color: #4a5568; font-size: 13px;">
        <span style="color: #48bb78; margin-right: 12px;">👍 ${s.agrees + s.superAgrees} agree</span>
        <span style="color: #f56565; margin-right: 12px;">👎 ${s.disagrees} disagree</span>
        <span style="color: #718096;">${total} votes</span>
      </div>
    </div>
  `;
};

const renderHighlightSection = async (
  title: string,
  statement: Statement,
  accentColor: string,
  bgColor: string,
): Promise<string> => `
  <div style="margin-bottom: 32px;">
    <h2 style="color: #030213; font-size: 20px; margin: 0 0 16px 0;">${title}</h2>
    ${await renderStatement(statement, accentColor, bgColor)}
  </div>
`;

const renderOtherConvo = (c: OtherConvo, frontendUrl: string): string => `
  <a href="${frontendUrl}/room/${c.id}" style="display: block; text-decoration: none; background-color: #fffbf0; border-left: 4px solid #fa709a; padding: 14px 16px; margin-bottom: 10px; border-radius: 8px;">
    <div style="color: #030213; font-weight: 600; font-size: 15px; margin-bottom: 4px;">${escapeHtml(c.topic)}</div>
    <div style="color: #4a5568; font-size: 13px;">👥 ${c.participantCount} ${c.participantCount === 1 ? "participant" : "participants"}</div>
  </a>
`;

export const generateDebateEndedEmailHtml = async (
  data: DebateEndedEmailData,
): Promise<string> => {
  const {
    room,
    topStatements,
    mostDisagreed,
    mostSplit,
    totalVotes,
    participantCount,
    otherConvos,
    frontendUrl,
    userId,
  } = data;

  const topicEscaped = escapeHtml(room.topic);
  const subHeard = room.subHeard;
  const subHeardDisplay = subHeard ? formatSubHeardDisplay(subHeard) : "";
  const newConvoUrl = subHeard
    ? `${frontendUrl}/h/${encodeURIComponent(subHeard)}`
    : `${frontendUrl}/`;

  const topStatementsHtml = topStatements.length > 0
    ? `
      <div style="margin-bottom: 32px;">
        <h2 style="color: #030213; font-size: 20px; margin: 0 0 16px 0;">🏆 Top Takes</h2>
        ${(
          await Promise.all(
            topStatements.map((s) => renderStatement(s, "#667eea", "#f8f9ff")),
          )
        ).join("")}
      </div>
    `
    : "";

  const mostDisagreedHtml = mostDisagreed
    ? await renderHighlightSection(
        "👎 Most Disagreed",
        mostDisagreed,
        "#f5576c",
        "#fff5f7",
      )
    : "";

  const mostSplitHtml = mostSplit
    ? await renderHighlightSection(
        "⚖️ Most Split Take",
        mostSplit,
        "#fa709a",
        "#fffbf0",
      )
    : "";

  const otherConvosHtml = otherConvos.length > 0
    ? `
      <div style="margin-bottom: 32px;">
        <h2 style="color: #030213; font-size: 20px; margin: 0 0 4px 0;">More from ${escapeHtml(subHeardDisplay)}</h2>
        <p style="color: #4a5568; font-size: 14px; margin: 0 0 16px 0;">Jump into another conversation in your community.</p>
        ${otherConvos.map((c) => renderOtherConvo(c, frontendUrl)).join("")}
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your debate just wrapped</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="${PURPLE_GRADIENT} color: #ffffff; padding: 40px 24px; text-align: center;">
          <h1 style="margin: 0 0 8px 0; font-size: 28px; line-height: 1.25;">${topicEscaped}</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">The votes are in — see how the room landed 👇</p>
        </div>

        <div style="padding: 32px 24px;">
          <div style="${PURPLE_GRADIENT} border-radius: 12px; padding: 20px; margin-bottom: 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding: 0 10px;">
                  <div style="color: #ffffff; font-size: 32px; font-weight: bold; margin-bottom: 4px;">${participantCount}</div>
                  <div style="color: rgba(255,255,255,0.9); font-size: 14px;">${participantCount === 1 ? "Participant" : "Participants"}</div>
                </td>
                <td align="center" style="padding: 0 10px;">
                  <div style="color: #ffffff; font-size: 32px; font-weight: bold; margin-bottom: 4px;">${totalVotes}</div>
                  <div style="color: rgba(255,255,255,0.9); font-size: 14px;">${totalVotes === 1 ? "Vote" : "Votes"}</div>
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${frontendUrl}/room/${room.id}" style="display: inline-block; ${PURPLE_GRADIENT} color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              See Full Results 📊
            </a>
          </div>

          ${topStatementsHtml}

          ${mostDisagreedHtml}

          ${mostSplitHtml}

          ${otherConvosHtml}

          <div style="text-align: center; padding: 24px 0 8px 0; border-top: 1px solid #e2e8f0;">
            <p style="color: #4a5568; font-size: 15px; margin: 0 0 16px 0;">Got something on your mind? Kick off the next conversation.</p>
            <a href="${newConvoUrl}" style="display: inline-block; background-color: #ffffff; color: #667eea; border: 2px solid #667eea; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Start a New Discussion ✨
            </a>
          </div>
        </div>

        <div style="padding: 24px; text-align: center; color: #717182; font-size: 14px; background-color: #f8f9fa;">
          <p style="margin: 0 0 8px 0;">Heard - Conversation made fun</p>
          <p style="margin: 0; font-size: 12px;">
            <a href="${frontendUrl}/unsubscribe?userId=${userId}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateFakeDebateEndedData = (
  frontendUrl: string,
): DebateEndedEmailData => {
  const room: DebateRoom = {
    id: "preview-room-id",
    topic: "Should cities ban cars from downtown areas?",
    phase: "results",
    gameNumber: 1,
    roundStartTime: Date.now(),
    participants: ["u1", "u2", "u3", "u4", "u5", "u6", "u7"],
    hostId: "u1",
    isActive: false,
    createdAt: Date.now() - 60 * 60 * 1000,
    mode: "realtime",
    subHeard: "dupont-circle-neighborhoods",
    endTime: Date.now() - 5 * 60 * 1000,
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
      text: "We'd need a real transit alternative first — banning cars without that just hurts working people.",
      author: "u3",
      agrees: 22,
      superAgrees: 4,
      disagrees: 2,
      passes: 0,
      roomId: room.id,
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "s3",
      text: "Deliveries, accessibility vehicles, and emergency services still need access.",
      author: "u4",
      agrees: 19,
      superAgrees: 5,
      disagrees: 1,
      passes: 2,
      roomId: room.id,
      timestamp: Date.now(),
      round: 2,
      voters: {},
    },
    {
      id: "s4",
      text: "Cars are essential — banning them downtown will kill small business and isolate the elderly.",
      author: "u5",
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
      id: "s5",
      text: "Charge a steep congestion fee instead of an outright ban.",
      author: "u6",
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

  const { topStatements, mostDisagreed, mostSplit } = rankStatements(
    allStatements,
    3,
  );

  const otherConvos: OtherConvo[] = [
    {
      id: "convo-1",
      topic: "Should Dupont Circle have a weekly farmer's market?",
      participantCount: 12,
    },
    {
      id: "convo-2",
      topic: "Best block in the neighborhood for a new mural?",
      participantCount: 8,
    },
    {
      id: "convo-3",
      topic: "Parking permits: who should they really be for?",
      participantCount: 15,
    },
  ];

  const totalVotes = allStatements.reduce(
    (sum, s) => sum + getTotalVoteCount(s),
    0,
  );

  return {
    room,
    topStatements,
    mostDisagreed,
    mostSplit,
    totalVotes,
    participantCount: room.participants.length,
    otherConvos,
    frontendUrl,
    userId: "preview-user",
  };
};
