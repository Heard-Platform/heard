import type { SentEmail } from "../../../types";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const now = Date.now();

function mockPreviewHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: -apple-system, sans-serif; padding: 24px; color: #1e293b;">
    <h2 style="margin-top:0">${subject}</h2>
    <p>${body}</p>
  </body>
</html>`;
}

const weeklyDigestHtml = mockPreviewHtml(
  "Your Weekly Digest",
  "Here's what happened in your rooms this week.",
);
const welcomeHtml = mockPreviewHtml("Welcome to Heard!", "Glad you're here — here's how to get started.");
const debateEndedHtml = mockPreviewHtml("Your room just wrapped up", "See the results now.");

// Real responses always obfuscate the recipient's email (see sent-emails-api.ts) —
// mock data mirrors that shape so the showcase matches production.
const river = { id: "u-river", email: "river••••@••••" };
const mossy = { id: "u-mossy", email: "mossy••••@••••" };
const fern = { id: "u-fern", email: "fern••••@••••" };
const cedar = { id: "u-cedar", email: "cedar••••@••••" };
const elm = { id: "u-elm", email: "elm••••@••••" };
const dusty = { id: "u-dusty", email: "dusty••••@••••" };
const rusty = { id: "u-rusty", email: "rusty••••@••••" };

export const healthySentEmails: SentEmail[] = [
  {
    id: "1",
    recipientId: river.id,
    recipientEmail: river.email,
    template: "Weekly Digest",
    sentAt: now - 7 * DAY_MS,
    previewSubject: "Your Weekly Digest",
    previewHtml: weeklyDigestHtml,
  },
  {
    id: "2",
    recipientId: mossy.id,
    recipientEmail: mossy.email,
    template: "Weekly Digest",
    sentAt: now - 7 * DAY_MS,
    previewSubject: "Your Weekly Digest",
    previewHtml: weeklyDigestHtml,
  },
  {
    id: "3",
    recipientId: mossy.id,
    recipientEmail: mossy.email,
    template: "Debate Ended",
    sentAt: now - 2 * DAY_MS,
    previewSubject: "Your room just wrapped up",
    previewHtml: debateEndedHtml,
  },
  {
    id: "4",
    recipientId: fern.id,
    recipientEmail: fern.email,
    template: "Welcome Email",
    sentAt: now - 3 * HOUR_MS,
    previewSubject: "Welcome to Heard!",
    previewHtml: welcomeHtml,
  },
  {
    id: "5",
    recipientId: cedar.id,
    recipientEmail: cedar.email,
    template: "Debate Ended",
    sentAt: now - 90 * 60 * 1000,
    previewSubject: "Your room just wrapped up",
    previewHtml: debateEndedHtml,
  },
  {
    id: "6",
    recipientId: elm.id,
    recipientEmail: elm.email,
    template: "Weekly Digest",
    sentAt: now - 3 * HOUR_MS,
    previewSubject: "Your Weekly Digest",
    previewHtml: weeklyDigestHtml,
  },
];

export const atRiskSentEmails: SentEmail[] = [
  ...healthySentEmails,
  // dusty and rusty have been emailed heavily — should surface at the top of the watchlist,
  // with enough history in the 8-30 day range to also trip the 30d threshold.
  { id: "7", recipientId: dusty.id, recipientEmail: dusty.email, template: "Weekly Digest", sentAt: now - 2 * HOUR_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "8", recipientId: dusty.id, recipientEmail: dusty.email, template: "Debate Ended", sentAt: now - 4 * HOUR_MS, previewSubject: "Your room just wrapped up", previewHtml: debateEndedHtml },
  { id: "9", recipientId: dusty.id, recipientEmail: dusty.email, template: "Weekly Digest", sentAt: now - 20 * HOUR_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "10", recipientId: dusty.id, recipientEmail: dusty.email, template: "Debate Ended", sentAt: now - 2 * DAY_MS, previewSubject: "Your room just wrapped up", previewHtml: debateEndedHtml },
  { id: "11", recipientId: dusty.id, recipientEmail: dusty.email, template: "Weekly Digest", sentAt: now - 5 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "12", recipientId: dusty.id, recipientEmail: dusty.email, template: "Weekly Digest", sentAt: now - 10 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "13", recipientId: dusty.id, recipientEmail: dusty.email, template: "Weekly Digest", sentAt: now - 12 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "14", recipientId: dusty.id, recipientEmail: dusty.email, template: "Weekly Digest", sentAt: now - 15 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "15", recipientId: dusty.id, recipientEmail: dusty.email, template: "Weekly Digest", sentAt: now - 18 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "16", recipientId: dusty.id, recipientEmail: dusty.email, template: "Weekly Digest", sentAt: now - 22 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "17", recipientId: rusty.id, recipientEmail: rusty.email, template: "Debate Ended", sentAt: now - 6 * HOUR_MS, previewSubject: "Your room just wrapped up", previewHtml: debateEndedHtml },
  { id: "18", recipientId: rusty.id, recipientEmail: rusty.email, template: "Weekly Digest", sentAt: now - 18 * HOUR_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "19", recipientId: rusty.id, recipientEmail: rusty.email, template: "Debate Ended", sentAt: now - 3 * DAY_MS, previewSubject: "Your room just wrapped up", previewHtml: debateEndedHtml },
  { id: "20", recipientId: rusty.id, recipientEmail: rusty.email, template: "Weekly Digest", sentAt: now - 6 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "21", recipientId: rusty.id, recipientEmail: rusty.email, template: "Weekly Digest", sentAt: now - 9 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "22", recipientId: rusty.id, recipientEmail: rusty.email, template: "Weekly Digest", sentAt: now - 14 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "23", recipientId: rusty.id, recipientEmail: rusty.email, template: "Weekly Digest", sentAt: now - 20 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "24", recipientId: rusty.id, recipientEmail: rusty.email, template: "Weekly Digest", sentAt: now - 25 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
  { id: "25", recipientId: rusty.id, recipientEmail: rusty.email, template: "Weekly Digest", sentAt: now - 28 * DAY_MS, previewSubject: "Your Weekly Digest", previewHtml: weeklyDigestHtml },
];
