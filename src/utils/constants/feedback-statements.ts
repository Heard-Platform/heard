export type FeedbackStatementKey =
  | "founder_chat"
  | "ui_confusing"
  | "enjoying"
  | "clear_idea"
  | "told_someone"
  | "topics_care";

export interface FeedbackStatement {
  key: FeedbackStatementKey;
  set: 1 | 2;
  text: string;
}

export const FEEDBACK_STATEMENTS: FeedbackStatement[] = [
  { key: "founder_chat", set: 1, text: "I'd be up for a 10 minute chat with the founder of this app" },
  { key: "ui_confusing", set: 1, text: "I find this app's interface confusing" },
  { key: "enjoying", set: 1, text: "I'm enjoying my experience on this app so far" },
  { key: "clear_idea", set: 2, text: "I'm clear on what the idea of Heard is" },
  { key: "told_someone", set: 2, text: "I've told someone about Heard" },
  { key: "topics_care", set: 2, text: "I'm seeing topics I care about on Heard" },
];

export const getFeedbackStatement = (key: FeedbackStatementKey): FeedbackStatement =>
  FEEDBACK_STATEMENTS.find((statement) => statement.key === key)!;
