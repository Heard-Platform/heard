import type { EventReport } from "../types";
import { ReportPage } from "../components/events/report/ReportPage";
import { StoryContainer } from "./StoryContainer";
import {
  NO_ATTENDEE_STATEMENTS_REPORT,
  NO_CAMPS_REPORT,
  NO_SUBTITLE_REPORT,
  PRICING_SESSION_REPORT,
} from "./event-report-fixtures";

const EVENT_REPORT_DESCRIPTION =
  "The shareable report after a live event, told as a story across all of its posts. A sticky bar at the top jumps between sections and copies the link. Opening: when the session started (in the viewer's time zone), people and minutes, the event's name and subtitle, four headline numbers, and the icon for ideas from the floor. 1, how the time went: the prompt the room talked about longest, minutes and voters per prompt. 2, prompt by prompt: a pill per prompt with its most agreed and most split statements and its top idea from the floor. 3, the floor: how the room's ideas did against the prepared ones, the favorite, the rest of the top five, and ideas that came too late to get votes. 4, the camps across all prompts with their defining statements. 5, what bridged them: every statement on a Venn of which camps agreed (click a dot), with bridge shortcuts. 6, the one statement every camp agreed on. 7, minute by minute: people voting every 20 seconds, with prompt starts and floor ideas marked. Summary: the headline numbers and takeaways, and the call to run Heard at your next event.";

interface EventReportDemoProps {
  report: EventReport;
}

function EventReportDemo({ report }: EventReportDemoProps) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <ReportPage report={report} />
    </div>
  );
}

export function EventReportStory() {
  return (
    <StoryContainer
      title="Event Report"
      description={EVENT_REPORT_DESCRIPTION}
      variants={[
        {
          id: "pricing-session",
          label: "Pricing session",
          children: (
            <EventReportDemo report={PRICING_SESSION_REPORT} />
          ),
        },
        {
          id: "no-subtitle",
          label: "No subtitle",
          children: <EventReportDemo report={NO_SUBTITLE_REPORT} />,
        },
        {
          id: "no-attendee-statements",
          label: "No ideas from the floor",
          children: (
            <EventReportDemo report={NO_ATTENDEE_STATEMENTS_REPORT} />
          ),
        },
        {
          id: "no-camps",
          label: "Too few people for camps",
          children: <EventReportDemo report={NO_CAMPS_REPORT} />,
        },
      ]}
    />
  );
}