import * as kv from "./kv_store.tsx";
import { getAllRealUsers } from "./kv-utils.tsx";
import { getFlyerEmails } from "./model-utils.ts";

export const getNewsletterSentKey = (edition: number): string => {
  return `newsletter:edition${edition}:sent-users`;
};

export const getNewsletterRecipients = async (
  newsletterEdition: number,
  testMode: boolean,
  testEmail: string,
) => {
  const newsletterSentKey = getNewsletterSentKey(newsletterEdition);
  const alreadySent = (await kv.get(newsletterSentKey)) || [];

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
