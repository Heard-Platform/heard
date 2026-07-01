import { AskTheData } from "../components/analysis/AskTheData";
import { StoryContainer } from "./StoryContainer";

export function AskTheDataStory() {
  return (
    <StoryContainer
      title="Ask the Data"
      description="Ask a question about a conversation and get an AI-generated answer. Uses the showcase mock in useDebateSession, so it works without a backend."
      variants={[
        {
          id: "default",
          label: "Default",
          children: <AskTheData debateId="demo-debate-123" />,
        },
      ]}
    />
  );
}
