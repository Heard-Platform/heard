import type { Statement } from "./types.tsx";
import { getSentEmails, saveSentEmail } from "./kv-utils.tsx";
import { getUserSession } from "./auth-api.tsx";
import { generateId } from "./debate-api.tsx";
import { isEligibleEmailRecipient, sendEmailViaResend } from "./email-sender-utils.tsx";
import { getFrontendUrl } from "./utils.tsx";
import {
  RESPONSE_VOTES_NOTIF_EMAIL_TYPE,
  RESPONSE_VOTES_NOTIF_VOTE_THRESHOLD,
  RESPONSE_VOTES_NOTIF_THROTTLE_MS,
  generateResponseVotesNotifHtml,
  getResponseVotesNotifSubject,
} from "./email-response-votes-notif-template.ts";

export const maybeEmailResponseVotesNotif = async (
  statement: Statement,
  prevOpinionatedCount: number,
): Promise<void> => {
  const newOpinionatedCount = statement.agrees + statement.disagrees;
  if (
    prevOpinionatedCount >= RESPONSE_VOTES_NOTIF_VOTE_THRESHOLD ||
    newOpinionatedCount < RESPONSE_VOTES_NOTIF_VOTE_THRESHOLD
  ) {
    return;
  }

  const author = (await getUserSession(statement.author)) ?? undefined;
  if (!isEligibleEmailRecipient(author)) {
    return;
  }

  const cutoff = Date.now() - RESPONSE_VOTES_NOTIF_THROTTLE_MS;
  const sentEmails = await getSentEmails();
  const alreadySentRecently = sentEmails.some(
    (email) =>
      email.userId === author.id &&
      email.emailType === RESPONSE_VOTES_NOTIF_EMAIL_TYPE &&
      email.sentAt >= cutoff,
  );
  if (alreadySentRecently) {
    return;
  }

  const frontendUrl = getFrontendUrl();
  const html = await generateResponseVotesNotifHtml({
    statement,
    frontendUrl,
    userId: author.id,
  });

  const result = await sendEmailViaResend({
    to: author.email,
    subject: getResponseVotesNotifSubject(),
    html,
  });

  if (!result.success) {
    console.error(
      `[response-votes-notif] Failed to send to ${author.id}: ${result.error}`,
    );
    return;
  }

  await saveSentEmail({
    id: generateId(),
    userId: author.id,
    sentAt: Date.now(),
    emailType: RESPONSE_VOTES_NOTIF_EMAIL_TYPE,
    roomId: statement.roomId,
  });
};
