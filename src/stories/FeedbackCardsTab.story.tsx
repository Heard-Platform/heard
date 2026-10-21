import { FeedbackCardsTab } from "../components/activity/feedback-cards/FeedbackCardsTab";
import type { FeedbackCardResults } from "../types";
import { FEEDBACK_STATEMENTS } from "../utils/constants/feedback-statements";
import { StoryContainer } from "./StoryContainer";

const now = Date.now();
const hoursAgo = (hours: number) => now - hours * 60 * 60 * 1000;

const emptyResults: FeedbackCardResults = {
  statements: FEEDBACK_STATEMENTS.map((statement) => ({
    statementKey: statement.key,
    agree: 0,
    superAgree: 0,
    disagree: 0,
    pass: 0,
    total: 0,
  })),
  founderOptIns: [],
  notes: [],
  usersShown: 0,
  usersVoted: 0,
  usersWithNote: 0,
};

const typicalResults: FeedbackCardResults = {
  statements: FEEDBACK_STATEMENTS.map((statement, i) => {
    const agree = 6 - i;
    const disagree = 2 + (i % 3);
    const pass = i % 2;
    return { statementKey: statement.key, agree, superAgree: 1, disagree, pass, total: agree + 1 + disagree + pass };
  }),
  founderOptIns: [
    { userId: "8f3a2c1d-anon", email: "beca@example.com", votedAt: hoursAgo(3) },
    { userId: "1b9e7f4a-user", email: null, votedAt: hoursAgo(26) },
  ],
  notes: [
    {
      id: "n1",
      userId: "4c2d9e8f-user",
      statementKey: "ui_confusing",
      roomId: "room-1",
      text: "I couldn't find how to start my own post.",
      createdAt: new Date(hoursAgo(2)).toISOString(),
    },
    {
      id: "n2",
      userId: "7a1b3c5d-anon",
      statementKey: "slow_load",
      roomId: "room-2",
      text: "Took a few seconds on my phone.",
      createdAt: new Date(hoursAgo(30)).toISOString(),
    },
  ],
  usersShown: 42,
  usersVoted: 31,
  usersWithNote: 3,
};

export function FeedbackCardsTabStory() {
  return (
    <StoryContainer
      title="Feedback Cards Tab"
      description="Activity dashboard tab: votes per feedback statement, founder chat opt-ins with emails, and notes from Tell us more"
      variants={[
        { id: "typical", label: "Typical", children: <FeedbackCardsTab results={typicalResults} /> },
        { id: "empty", label: "No data", children: <FeedbackCardsTab results={emptyResults} /> },
      ]}
    />
  );
}
