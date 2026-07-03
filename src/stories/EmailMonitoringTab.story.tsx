import { StoryContainer } from "./StoryContainer";
import { EmailMonitoringTab } from "../components/devtools/EmailMonitoringTab";
import {
  healthySentEmails,
  atRiskSentEmails,
} from "../components/devtools/emailMonitoringMockData";

export function EmailMonitoringTabStory() {
  return (
    <StoryContainer
      title="Email Monitoring"
      description="Dev tools tab for tracking sent-email volume, per-recipient frequency, and previewing what went out"
      variants={[
        {
          id: "healthy",
          label: "Healthy",
          children: <EmailMonitoringTab sentEmails={healthySentEmails} />,
        },
        {
          id: "at-risk",
          label: "At Risk",
          children: <EmailMonitoringTab sentEmails={atRiskSentEmails} />,
        },
        {
          id: "empty",
          label: "No sends yet",
          children: <EmailMonitoringTab sentEmails={[]} />,
        },
      ]}
    />
  );
}
