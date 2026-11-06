import type {
  EventReportCamp,
  EventReportPost,
  EventReportStatementByCamp,
} from "../../../types";
import { findPostTopic } from "../../../utils/event-report";
import { getCampAgreePercent } from "../../../utils/event-report-venn";
import { REPORT_SECTION_IDS } from "./report-sections";
import { ResponseMark } from "./ResponseMark";
import { SectionLabel } from "./SectionHeading";
import "./report.css";

interface CommonGroundSectionProps {
  camps: EventReportCamp[];
  commonGroundStatement: EventReportStatementByCamp | null;
  posts: EventReportPost[];
}

export function CommonGroundSection({
  camps,
  commonGroundStatement,
  posts,
}: CommonGroundSectionProps) {
  if (camps.length === 0) return null;

  return (
    <section
      id={REPORT_SECTION_IDS.commonGround}
      className="report-common-ground-bg scroll-mt-16"
    >
      <div className="report-section-content items-center py-24 text-center">
        <SectionLabel sectionName="Common ground" />
        {commonGroundStatement ? (
          <CommonGroundStatement
            camps={camps}
            statement={commonGroundStatement}
            posts={posts}
          />
        ) : (
          <h2 className="report-header max-w-3xl">
            No single statement won over every camp.
          </h2>
        )}
      </div>
    </section>
  );
}

interface CommonGroundStatementProps {
  camps: EventReportCamp[];
  statement: EventReportStatementByCamp;
  posts: EventReportPost[];
}

function CommonGroundStatement({
  camps,
  statement,
  posts,
}: CommonGroundStatementProps) {
  const campAgreementSummary = camps
    .map(
      (camp) =>
        `${camp.name} ${getCampAgreePercent(statement, camp.campId)}%`,
    )
    .join(" · ");

  return (
    <>
      <h2 className="text-2xl font-bold secondary-text-strong">
        And the one thing all {camps.length} camps agreed on:
      </h2>
      <p className="report-common-ground-quote max-w-4xl">
        "{statement.text}"
      </p>
      <p className="max-w-2xl text-sm secondary-text-strong">
        {findPostTopic(posts, statement.postNumber)}
      </p>
      {statement.isAttendeeStatement && (
        <span className="report-response-strong-text flex items-center gap-1.5 text-sm font-semibold">
          <ResponseMark className="h-4 w-4 shrink-0" />
          An idea from the floor
        </span>
      )}
      <div className="flex flex-wrap justify-center gap-2.5">
        <span className="normal-bg rounded-full px-4 py-2 font-semibold">
          {statement.overallAgreePercent}% of the room
        </span>
        <span className="normal-bg rounded-full px-4 py-2 secondary-text-strong">
          {campAgreementSummary}
        </span>
      </div>
    </>
  );
}