import type { DebateRoom, Statement } from "./types.tsx";
import { escapeHtml } from "./utils.tsx";
import { rankStatements } from "./statement-utils.tsx";
import { extractYouTubeVideoId, fetchYouTubeTitle } from "./youtube-utils.tsx";

export const NEW_STATEMENTS_EMAIL_TYPE = "new_statements_notification";

export const getNewStatementsSubject = (
  topic: string,
  statementCount: number,
): string => {
  const topicTrimmed =
    topic.length > 50 ? topic.substring(0, 50) + "..." : topic;
  return `${statementCount} new statement${statementCount === 1 ? "" : "s"} to vote on in "${topicTrimmed}"`;
};

export interface NewStatementsEmailData {
  room: DebateRoom;
  statements: Statement[];
  frontendUrl: string;
  userId: string;
}

const PURPLE_GRADIENT =
  "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);";

const renderStatementBody = async (text: string): Promise<string> => {
  const videoId = extractYouTubeVideoId(text);
  if (!videoId) {
    return `"${escapeHtml(text)}"`;
  }
  const title = await fetchYouTubeTitle(videoId);
  return `<a href="${escapeHtml(text)}" target="_blank" rel="noopener noreferrer" style="color: #2d3748; text-decoration: underline; text-underline-offset: 2px;">${escapeHtml(title ?? text)}</a>`;
};

const renderStatementPreview = async (s: Statement): Promise<string> => {
  const body = await renderStatementBody(s.text);
  return `
    <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 12px; border-radius: 8px;">
      <div style="color: #2d3748; font-size: 15px; line-height: 1.5;">${body}</div>
    </div>
  `;
};

export const generateNewStatementsEmailHtml = async (
  data: NewStatementsEmailData,
): Promise<string> => {
  const { room, statements, frontendUrl, userId } = data;
  const topicEscaped = escapeHtml(room.topic);
  const statementCount = statements.length;

  const { topStatements } = rankStatements(statements, 3);
  const previewStatements =
    topStatements.length > 0 ? topStatements : statements.slice(0, 3);
  const previewHtml = (
    await Promise.all(previewStatements.map(renderStatementPreview))
  ).join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New statements to vote on</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="${PURPLE_GRADIENT} color: #ffffff; padding: 40px 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">${statementCount} new statement${statementCount === 1 ? "" : "s"} to vote on</p>
          <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">${topicEscaped}</h1>
        </div>

        <div style="padding: 32px 24px;">
          ${previewHtml}

          <div style="text-align: center; margin-top: 24px;">
            <a href="${frontendUrl}/room/${room.id}" style="display: inline-block; ${PURPLE_GRADIENT} color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Vote Now 🗳️
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
