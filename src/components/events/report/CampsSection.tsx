import type {
  EventReportCamp,
  EventReportCampStatement,
  EventReportPost,
} from "../../../types";
import { findPostTopic } from "../../../utils/event-report";
import { pluralizePerson } from "../../../utils/text";
import { getCampColorClassNames } from "./camp-colors";
import { REPORT_SECTION_IDS } from "./report-sections";
import { ResponseMark } from "./ResponseMark";
import { SectionHeading } from "./SectionHeading";
import "./report.css";

const CAMPS_DESCRIPTION =
  "Found by comparing everyone's votes across the whole session."

interface CampsSectionProps {
  camps: EventReportCamp[];
  posts: EventReportPost[];
}

export function CampsSection({ camps, posts }: CampsSectionProps) {
  const headline =
    camps.length === 0
      ? "Not enough people voted across prompts to find camps."
      : [
        `Across all ${posts.length} prompts,`,
        `the room fell into ${camps.length} camps.`,
      ].join(" ");

  return (
    <section
      id={REPORT_SECTION_IDS.camps}
      className="dark-bg normal-text scroll-mt-16"
    >
      <div className="report-section-content py-20">
        <SectionHeading
          sectionName="The camps"
          headline={headline}
          description={CAMPS_DESCRIPTION}
        />
        {camps.length > 0 && (
          <>
            <CampSizeBar camps={camps} />
            <div className="grid gap-4 lg:grid-cols-3">
              {camps.map((camp, campIndex) => (
                <CampCard
                  key={camp.campId}
                  camp={camp}
                  campIndex={campIndex}
                  posts={posts}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

interface CampSizeBarProps {
  camps: EventReportCamp[];
}

function CampSizeBar({ camps }: CampSizeBarProps) {
  return (
    <div className="flex h-3.5 gap-1 overflow-hidden rounded-full">
      {camps.map((camp, campIndex) => (
        <div
          key={camp.campId}
          className={
            getCampColorClassNames(campIndex).solidBackground
          }
          style={{ width: `${camp.sizePercent}%` }}
        />
      ))}
    </div>
  );
}

interface CampCardProps {
  camp: EventReportCamp;
  campIndex: number;
  posts: EventReportPost[];
}

function CampCard({ camp, campIndex, posts }: CampCardProps) {
  const campColors = getCampColorClassNames(campIndex);

  return (
    <div className="report-camps-card-border flex flex-col gap-4 rounded-2xl border p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={`${campColors.accentText} text-2xl font-bold`}>
          {camp.name}
        </h3>
        <span className="report-subtext tabular-nums">
          {camp.memberCount}{" "}
          {pluralizePerson(camp.memberCount)} · {camp.sizePercent}%
        </span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {camp.representativeStatements.map((statement) => (
          <CampStatement
            key={statement.statementId}
            statement={statement}
            posts={posts}
          />
        ))}
      </ul>
    </div>
  );
}

interface CampStatementProps {
  statement: EventReportCampStatement;
  posts: EventReportPost[];
}

function CampStatement({ statement, posts }: CampStatementProps) {
  return (
    <li className="report-camps-statement-bg flex flex-col gap-1 rounded-xl px-4 py-3">
      <span className="report-subtext text-xs">
        {findPostTopic(posts, statement.postNumber)}
      </span>
      <span className="flex gap-2 leading-snug">
        {statement.isAttendeeStatement && (
          <ResponseMark className="mt-0.5 h-4 w-4 report-response-text" />
        )}
        {statement.text}
      </span>
      <span className="report-subtext text-sm">
        {statement.campAgreePercent}% of this camp agree ·{" "}
        {statement.otherCampsAgreePercent}% of the rest
      </span>
    </li>
  );
}