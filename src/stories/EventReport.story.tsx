import type { EventReport } from "../types";
import { OpeningSection } from "../components/events/report/OpeningSection";
import { TimeSection } from "../components/events/report/TimeSection";
import { StoryContainer } from "./StoryContainer";
import {
  NO_SUBTITLE_REPORT,
  PRICING_SESSION_REPORT,
} from "./event-report-fixtures";

interface EventReportDemoProps {
  report: EventReport;
}

function EventReportDemo({ report }: EventReportDemoProps) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <OpeningSection opening={report.opening} />
      <TimeSection
        posts={report.posts}
        peopleCount={report.opening.peopleCount}
      />
    </div>
  );
}

export function EventReportStory() {
  return (
    <StoryContainer
      title="Event Report"
      description="The shareable report after a live event, told as a story across all of its posts. The opening: when the session started (in the viewer's time zone), how many people and minutes, the event's name and subtitle, the four headline numbers, and the mark used for ideas from the floor everywhere in the report. Chapter 1, how the time went: which prompt held the room longest, minutes on each prompt, and how many people voted on each, ending with how many voted on the last one."
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
      ]}
    />
  );
}