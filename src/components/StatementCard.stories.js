import { StatementCard } from "./StatementCard";
import { api } from "../utils/api";

export default {
  title: "Components/StatementCard",
  component: StatementCard,
  parameters: {
    layout: "centered",
  },
};

const sampleStatement = {
  id: "1",
  text: "Fox can KO at 60% with up-smash. That is wild.",
  author: "Alice",
  votes: 5,
  type: "crux",
};

export const Default = {
  args: {
    statement: sampleStatement,
    onVote: () => {},
    onFlag: () => {},
    canVote: true,
  },
};
