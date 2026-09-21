import type { Statement } from "./types.tsx";
import { renderStatementText } from "./email-statement-text.tsx";

export const RESPONSE_VOTES_NOTIF_EMAIL_TYPE = "response_votes_notif";
export const RESPONSE_VOTES_NOTIF_BUTTON_CLICKED_EVENT =
  "response_votes_notif_button_clicked";
export const RESPONSE_VOTES_NOTIF_VOTE_THRESHOLD = 3;
export const RESPONSE_VOTES_NOTIF_THROTTLE_MS = 24 * 60 * 60 * 1000;

export const getResponseVotesNotifSubject = (): string =>
  "People are voting on what you wrote";

export interface ResponseVotesNotifEmailData {
  statement: Statement;
  frontendUrl: string;
  userId: string;
}

const PURPLE_GRADIENT =
  "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);";

export const generateResponseVotesNotifHtml = async (
  data: ResponseVotesNotifEmailData,
): Promise<string> => {
  const { statement, frontendUrl, userId } = data;
  const opinionatedVotes = statement.agrees + statement.disagrees;
  const statementBody = await renderStatementText(statement.text);
  const clickUrl = `${frontendUrl}/email/click?eventType=${encodeURIComponent(RESPONSE_VOTES_NOTIF_BUTTON_CLICKED_EVENT)}&userId=${encodeURIComponent(userId)}&roomId=${encodeURIComponent(statement.roomId)}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>People are voting on what you wrote</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="${PURPLE_GRADIENT} color: #ffffff; padding: 40px 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">${opinionatedVotes} people have weighed in</p>
          <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">People are voting on what you wrote 👀</h1>
        </div>

        <div style="padding: 32px 24px;">
          <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 12px; border-radius: 8px;">
            <div style="color: #2d3748; font-size: 15px; line-height: 1.5;">${statementBody}</div>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${clickUrl}" style="display: inline-block; ${PURPLE_GRADIENT} color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              See what people think →
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

export const generateFakeResponseVotesNotifData = (
  frontendUrl: string,
): ResponseVotesNotifEmailData => {
  const statement: Statement = {
    id: "preview-statement-id",
    text: "Pedestrian-only zones make downtowns more pleasant and boost local business.",
    author: "preview-user-id",
    agrees: 5,
    superAgrees: 2,
    disagrees: 2,
    passes: 1,
    roomId: "preview-room-id",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  };

  return {
    statement,
    frontendUrl,
    userId: "preview-user-id",
  };
};
