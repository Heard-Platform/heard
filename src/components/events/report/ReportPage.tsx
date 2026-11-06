import type { EventReport } from "../../../types";
import { BridgesSection } from "./BridgesSection";
import { CampsSection } from "./CampsSection";
import { CommonGroundSection } from "./CommonGroundSection";
import { FloorSection } from "./FloorSection";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";
import { OpeningSection } from "./OpeningSection";
import { PromptsSection } from "./PromptsSection";
import { SummarySection } from "./SummarySection";
import { TimelineSection } from "./TimelineSection";
import { TimeSection } from "./TimeSection";

interface ReportPageProps {
  report: EventReport;
}

export function ReportPage({ report }: ReportPageProps) {
  const { opening, posts, floor, campAnalysis, timeline } = report;

  return (
    <div className="normal-bg dark-text">
      <Navigation eventName={opening.eventName} />
      <OpeningSection opening={opening} />
      <TimeSection posts={posts} peopleCount={opening.peopleCount} />
      <PromptsSection posts={posts} />
      <FloorSection
        floor={floor}
        posts={posts}
        attendeeStatementCount={opening.attendeeStatementCount}
        peopleCount={opening.peopleCount}
      />
      <CampsSection
        camps={campAnalysis.camps}
        postCount={opening.postCount}
      />
      <BridgesSection campAnalysis={campAnalysis} />
      <CommonGroundSection
        camps={campAnalysis.camps}
        commonGroundStatement={campAnalysis.commonGroundStatement}
      />
      <TimelineSection
        timeline={timeline}
        posts={posts}
        sessionStartedAt={opening.sessionStartedAt}
      />
      <SummarySection report={report} />
      <Footer />
    </div>
  );
}