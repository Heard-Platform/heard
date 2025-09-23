import { Statement } from "../types";
import { StatementCard, StatementCardProps } from "./StatementCard";

export default {
  title: "Components/StatementCard",
  component: StatementCard,
  parameters: {
    layout: "centered",
  },
};

const sampleStatement: Statement = {
  id: "1",
  text: "Fox can KO at 60% with up-smash. That is wild.",
  author: "Alice",
  agrees: 5,
  disagrees: 2,
  passes: 1,
  type: "crux",
  roomId: "room-1",
  timestamp: Date.now(),
  voters: { user2: "agree", user3: "disagree" },
};

const props: StatementCardProps = {
  statement: sampleStatement,
  onVote: (id, type) => {
    console.log(`Voted ${type} on statement ${id}`);
  },
  onFlag: () => {
    console.log("Flagged statement");
  },
  canVote: true,
  currentUserId: "user1",
};

export const Default = {
  args: props,
};

const agreedStatement = {
  ...sampleStatement,
  voters: { user1: "agree" },
};

export const Agreed = {
  args: { ...props, statement: agreedStatement },
};

const disagreedStatement = {
  ...sampleStatement,
  voters: { user1: "disagree" },
};

export const Disagreed = {
  args: { ...props, statement: disagreedStatement },
};
