import { filterVisibleStatements, getStatement, getUser, getVote, getVotesForStatement } from "./kv-utils.tsx";
import { getUsableStatementsForRoom } from "./room-utils.ts";
import { getOpinionatedVoteCount } from "./statement-utils.tsx";
import { isEligibleEmailRecipient, sendEmailViaResend, sendMaxOnce, type SendEmailParams } from "./email-sender-utils.tsx";
import { hasSentEmail } from "./model-utils.ts";
import { getLatestResultsTime, isAfterRevealTime } from "./flyer-results-time.ts";
import { ONE_DAY_MS } from "./time-utils.ts";
import { createEmailLoginToken } from "./email-login-links.ts";
import { FLYER_WELCOME_EMAIL_TYPE, generateFlyerWelcomeEmailHtml, getFlyerWelcomeSubject } from "./template-flyer-welcome.ts";
import { FLYER_RESULTS_EMAIL_TYPE, FLYER_RESULTS_SUBJECT, generateFlyerResultsEmailHtml } from "./template-flyer-results.ts";
import type { User, Vote, VoteType } from "./types.tsx";

export const WAYMO_FLYER_STATEMENT_ID = "ecgld4qfclqmq8l9p82";
const RESULTS_LOOKBACK_MS = 3 * ONE_DAY_MS;
const MAX_OTHER_STATEMENTS = 3;

export type EmailableUser = User & { email: string };

export const sendFlyerWelcomeEmail = async (user: EmailableUser, vote: Vote): Promise<void> => {
  const statement = await getStatement(WAYMO_FLYER_STATEMENT_ID);
  if (!statement) throw new Error(`Flyer statement ${WAYMO_FLYER_STATEMENT_ID} not found`);

  const areResultsTomorrow = isAfterRevealTime(Date.now());
  const loginToken = await createEmailLoginToken(user.id);
  await sendMaxOnce(user.id, FLYER_WELCOME_EMAIL_TYPE, {
    to: user.email,
    subject: getFlyerWelcomeSubject(areResultsTomorrow),
    html: generateFlyerWelcomeEmailHtml({
      statementText: statement.text,
      vote: vote.voteType,
      areResultsTomorrow,
      roomId: statement.roomId,
      userId: user.id,
      loginToken,
    }),
  });
};

const loadFlyerResults = async () => {
  const statement = await getStatement(WAYMO_FLYER_STATEMENT_ID);
  if (!statement) throw new Error(`Flyer statement ${WAYMO_FLYER_STATEMENT_ID} not found`);
  const otherStatements = filterVisibleStatements(await getUsableStatementsForRoom(statement.roomId))
    .filter((s) => s.id !== statement.id && getOpinionatedVoteCount(s) > 0)
    .sort((a, b) => getOpinionatedVoteCount(b) - getOpinionatedVoteCount(a))
    .slice(0, MAX_OTHER_STATEMENTS);
  return { statement, otherStatements };
};

const buildFlyerResultsEmail = async (
  user: EmailableUser,
  voteType: VoteType,
  { statement, otherStatements }: Awaited<ReturnType<typeof loadFlyerResults>>,
): Promise<SendEmailParams> => ({
  to: user.email,
  subject: FLYER_RESULTS_SUBJECT,
  html: generateFlyerResultsEmailHtml({
    flyerStatement: statement,
    vote: voteType,
    otherStatements,
    userId: user.id,
    loginToken: await createEmailLoginToken(user.id),
  }),
});

export interface FlyerResultsRecipient {
  user: EmailableUser;
  vote: Vote;
}

export const getFlyerResultsRecipients = async (now: number) => {
  const resultsTime = getLatestResultsTime(now);
  const votes = await getVotesForStatement(WAYMO_FLYER_STATEMENT_ID);
  const votesInWindow = votes.filter((vote) =>
    vote.flyerId && vote.timestamp >= resultsTime - RESULTS_LOOKBACK_MS && vote.timestamp < resultsTime
  );

  const recipients: FlyerResultsRecipient[] = [];
  for (const vote of votesInWindow) {
    const user = await getUser(vote.userId);
    if (!user || !isEligibleEmailRecipient(user)) continue;
    if (await hasSentEmail(user.id, FLYER_RESULTS_EMAIL_TYPE)) continue;
    recipients.push({ user, vote });
  }
  return recipients;
};

export const sendFlyerResultsEmails = async (now: number) => {
  const [recipients, results] = await Promise.all([getFlyerResultsRecipients(now), loadFlyerResults()]);

  let sent = 0;
  for (const { user, vote } of recipients) {
    try {
      const email = await buildFlyerResultsEmail(user, vote.voteType, results);
      const wasSent = await sendMaxOnce(user.id, FLYER_RESULTS_EMAIL_TYPE, email);
      if (wasSent) sent++;
    } catch (error) {
      console.error(`[flyer-results-email] Failed for user ${user.id}:`, error);
    }
  }
  return { sent };
};

export const sendTestFlyerResultsEmail = async (user: EmailableUser) => {
  const vote = await getVote(WAYMO_FLYER_STATEMENT_ID, user.id);
  const results = await loadFlyerResults();
  const email = await buildFlyerResultsEmail(user, vote?.voteType ?? "agree", results);
  const result = await sendEmailViaResend(email);
  if (!result.success) throw new Error(result.error);
};
