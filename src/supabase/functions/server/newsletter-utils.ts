import { getAllRealUsers, getNewsletterSentUsers } from "./kv-utils.tsx";
import { getFlyerEmails } from "./model-utils.ts";
import { getNewsletter5Email } from "./email-newsletter-5.ts";
import { getNewsletter6Email } from "./email-newsletter-6.ts";
import { getNewsletterEmailByEdition } from "./email-newsletters.ts";
import { getNewsletter2Email, getNewsletterEmail } from "./email-templates.tsx";
import { getNewsletter3Email } from "./email-newsletter-3.ts";
import { getNewsletter7Email } from "./email-newsletter-7.ts";
import { getNewsletter4Email } from "./email-newsletter-4.ts";


export const getNewsletterByEdition = async (
  edition: number,
) => {
  let subject: string;
  let getNewsletterHtml: () => string;

  if (edition === 4) {
    const newsletter4 = getNewsletter4Email();
    subject = newsletter4.subject;
    getNewsletterHtml = () => newsletter4.html;
  } else if (edition === 5) {
    const newsletter5 = getNewsletter5Email();
    subject = newsletter5.subject;
    getNewsletterHtml = () => newsletter5.html;
  } else if (edition === 6) {
    const newsletter6 = getNewsletter6Email();
    subject = newsletter6.subject;
    getNewsletterHtml = () => newsletter6.html;
  } else if (edition === 7) {
    const newsletter7 = getNewsletter7Email();
    subject = newsletter7.subject;
    getNewsletterHtml = () => newsletter7.html;
  } else if (edition > 7) {
    const newsletter = getNewsletterEmailByEdition(edition);
    subject = newsletter.subject;
    getNewsletterHtml = () => newsletter.html;
  } else {
    const getNewsletterHtmlFn =
      edition === 2
        ? getNewsletter2Email
        : edition === 3
          ? getNewsletter3Email
          : getNewsletterEmail;
    const newsletterSubjects = {
      1: "The 1st Heard Newsletter! Cold showers, live streams, and QR codes - oh my!",
      2: "The 2nd Heard Newsletter! Heard in the news, broken strings, and getting closer to 100 users!",
      3: "Heard Newsletter #3! GoFundMe, rickrolls, and roadmap",
    };
    subject =
      newsletterSubjects[edition as 1 | 2 | 3] ||
      newsletterSubjects[1];
    getNewsletterHtml = getNewsletterHtmlFn;
  }

  return { subject, html: getNewsletterHtml() };
};

export const getNewsletterRecipients = async (
  newsletterEdition: number,
  testMode: boolean,
  testEmail: string,
) => {
  const alreadySent = await getNewsletterSentUsers(newsletterEdition);

  if (testMode && testEmail) {
    return {
      eligibleUsers: [{ email: testEmail, id: "test" }],
      alreadySent,
    };
  }

  const users = await getAllRealUsers();
  const userRecipients = users
    .filter(
      (u) =>
        !u.isTestUser &&
        !u.isAnonymous &&
        u.email &&
        !u.isUnsubbedFromUpdates,
    )
    .map((u) => ({ email: u.email, id: u.id }));

  const flyerEmailsData = await getFlyerEmails();
  const flyerRecipients = flyerEmailsData.map((f) => ({
    email: f.email,
    id: f.email,
  }));

  const allRecipients = [...userRecipients, ...flyerRecipients];
  const emailSet = new Set<string>();
  const deduplicatedRecipients: { email: string; id: string }[] = [];

  for (const recipient of allRecipients) {
    if (
      !emailSet.has(recipient.email) &&
      !alreadySent.includes(recipient.id)
    ) {
      emailSet.add(recipient.email);
      deduplicatedRecipients.push(recipient);
    }
  }

  return {
    eligibleUsers: deduplicatedRecipients,
    alreadySent,
  };
};
