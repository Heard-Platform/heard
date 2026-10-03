import { filterVisibleStatements, getStatement, getUser, getVote, getVotesForStatement } from "./kv-utils.tsx";
import { getUsableStatementsForRoom } from "./room-utils.ts";
import { getOpinionatedVoteCount } from "./statement-utils.tsx";
import { isEligibleEmailRecipient, sendEmailViaResend, sendMaxOnce, type SendEmailParams } from "./email-sender-utils.tsx";
import { getLatestResultsTime, isAfterRevealTime } from "./flyer-results-time.ts";
import { ONE_DAY_MS } from "./time-utils.ts";
import { FLYER_WELCOME_EMAIL_TYPE, generateFlyerWelcomeEmailHtml, getFlyerWelcomeSubject } from "./template-flyer-welcome.ts";
import { FLYER_RESULTS_EMAIL_TYPE, FLYER_RESULTS_SUBJECT, generateFlyerResultsEmailHtml } from "./template-flyer-results.ts";
import type { User, Vote } from "./types.tsx";

export const WAYMO_FLYER_STATEMENT_ID = "ecgld4qfclqmq8l9p82";
const RESULTS_LOOKBACK_MS = 3 * ONE_DAY_MS;
const MAX_OTHER_STATEMENTS = 3;

type EmailableUser = User & { email: string };

export const sendFlyerWelcomeEmail = async (user: EmailableUser, vote: Vote): Promise<void> => {
  const statement = await getStatement(WAYMO_FLYER_STATEMENT_ID);
  if (!statement) throw new Error(`Flyer statement ${WAYMO_FLYER_STATEMENT_ID} not found`);

  const areResultsTomorrow = isAfterRevealTime(Date.now());
  await sendMaxOnce(user.id, FLYER_WELCOME_EMAIL_TYPE, {
    to: user.email,
    subject: getFlyerWelcomeSubject(areResultsTomorrow),
    html: generateFlyerWelcomeEmailHtml({
      statementText: statement.text,
      vote: vote.voteType,
      areResultsTomorrow,
      userId: user.id,
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

const buildFlyerResultsEmail = (
  user: EmailableUser,
  vote: Vote,
  { statement, otherStatements }: Awaited<ReturnType<typeof loadFlyerResults>>,
): SendEmailParams => ({
  to: user.email,
  subject: FLYER_RESULTS_SUBJECT,
  html: generateFlyerResultsEmailHtml({
    flyerStatement: statement,
    vote: vote.voteType,
    otherStatements,
    userId: user.id,
  }),
});

/** Emails everyone whose flyer vote came in before the latest 7 PM and who hasn't gotten results yet. */
export const sendFlyerResultsEmails = async (now = Date.now()) => {
  const resultsTime = getLatestResultsTime(now);
  const [votes, results] = await Promise.all([
    getVotesForStatement(WAYMO_FLYER_STATEMENT_ID),
    loadFlyerResults(),
  ]);
  const dueVotes = votes.filter((vote) =>
    vote.flyerId &&
    vote.timestamp < resultsTime &&
    vote.timestamp >= resultsTime - RESULTS_LOOKBACK_MS
  );

  let sent = 0;
  for (const vote of dueVotes) {
    try {
      const user = await getUser(vote.userId);
      if (!user || !isEligibleEmailRecipient(user)) continue;
      if (await sendMaxOnce(user.id, FLYER_RESULTS_EMAIL_TYPE, buildFlyerResultsEmail(user, vote, results))) {
        sent++;
      }
    } catch (error) {
      console.error(`[flyer-results-email] Failed for user ${vote.userId}:`, error);
    }
  }
  return { sent };
};

export const sendTestFlyerResultsEmail = async (user: EmailableUser) => {
  const vote = await getVote(WAYMO_FLYER_STATEMENT_ID, user.id);
  if (!vote) throw new Error(`User ${user.id} has no Waymo flyer vote`);
  const result = await sendEmailViaResend(buildFlyerResultsEmail(user, vote, await loadFlyerResults()));
  if (!result.success) throw new Error(result.error);
  return { emailId: result.emailId };
};
