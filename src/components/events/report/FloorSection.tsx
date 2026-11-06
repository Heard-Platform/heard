import type { ReactNode } from "react";
import type {
  EventReportAttendeeStatement,
  EventReportFloor,
  EventReportPost,
} from "../../../types";
import {
  findPostTopic,
  getOneInHowMany,
} from "../../../utils/event-report";
import {
  pluralizeIdea,
  pluralizePerson,
  pluralizeVote,
} from "../../../utils/text";
import { ResponseMark } from "./ResponseMark";
import { SectionHeading } from "./SectionHeading";
import { VoteBar } from "./VoteBar";
import { REPORT_SECTION_IDS } from "./report-sections";
import "./report.css";

const FLOOR_HEADLINE =
  "The room had some ideas to throw in the mix also";

interface FloorSectionProps {
  floor: EventReportFloor;
  posts: EventReportPost[];
  attendeeStatementCount: number;
  peopleCount: number;
}

export function FloorSection({
  floor,
  posts,
  attendeeStatementCount,
  peopleCount,
}: FloorSectionProps) {
  const [favoriteStatement, ...runnerUpStatements] =
    floor.topAttendeeStatements;

  return (
    <section
      id={REPORT_SECTION_IDS.floor}
      className="report-floor-bg normal-text scroll-mt-16"
    >
      <div className="report-section-content py-20">
        <SectionHeading
          sectionName="The floor"
          headline={FLOOR_HEADLINE}
          description={describeFloor(floor, attendeeStatementCount)}
        />
        {favoriteStatement && (
          <>
            <FloorStats floor={floor} peopleCount={peopleCount} />
            <FavoriteStatementCard
              statement={favoriteStatement}
              posts={posts}
            />
            <RunnerUpStatements
              statements={runnerUpStatements}
              posts={posts}
            />
          </>
        )}
        <LowVoteStatements
          statements={floor.lowVoteAttendeeStatements}
          posts={posts}
        />
      </div>
    </section>
  );
}

function describeFloor(
  floor: EventReportFloor,
  attendeeStatementCount: number,
): string {
  if (attendeeStatementCount === 0) {
    return "Nobody added an idea of their own this time.";
  }
  const ideasAndVotes = [
    `${attendeeStatementCount} ${pluralizeIdea(attendeeStatementCount)}`,
    `came from ${floor.attendeeCount} different`,
    `${pluralizePerson(floor.attendeeCount)}, and the room voted on`,
    `them ${floor.attendeeStatementVoteCount} times.`,
  ].join(" ");
  const didFloorBeatPrepared =
    floor.averageAttendeeAgreePercent >
    floor.averagePreparedAgreePercent;
  if (!didFloorBeatPrepared) return ideasAndVotes;
  return `${ideasAndVotes} The room's own ideas beat the prepared ones.`;
}

interface FloorStatsProps {
  floor: EventReportFloor;
  peopleCount: number;
}

function FloorStats({ floor, peopleCount }: FloorStatsProps) {
  const oneInHowMany = getOneInHowMany(
    floor.attendeeCount,
    peopleCount,
  );

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <FloorStatCard>
        <p className="report-stat-value">
          {floor.attendeeStatementsInTopTenCount} of 10
        </p>
        <p className="text-sm report-floor-subtext">
          most agreed statements came from the floor
        </p>
      </FloorStatCard>
      <FloorStatCard>
        <p className="text-sm report-floor-subtext">
          Average agreement
        </p>
        <AgreementComparisonRow
          label="From the floor"
          agreePercent={floor.averageAttendeeAgreePercent}
          fillClassName="report-floor-fill"
        />
        <AgreementComparisonRow
          label="Prepared"
          agreePercent={floor.averagePreparedAgreePercent}
          fillClassName="report-prepared-fill"
        />
      </FloorStatCard>
      <FloorStatCard>
        <p className="report-stat-value">1 in {oneInHowMany}</p>
        <p className="text-sm report-floor-subtext">
          people in the room added an idea of their own
        </p>
      </FloorStatCard>
    </div>
  );
}

function FloorStatCard({ children }: { children: ReactNode }) {
  return (
    <div className="report-floor-card-bg flex flex-col gap-2 rounded-2xl px-5 py-4">
      {children}
    </div>
  );
}

interface AgreementComparisonRowProps {
  label: string;
  agreePercent: number;
  fillClassName: string;
}

function AgreementComparisonRow({
  label,
  agreePercent,
  fillClassName,
}: AgreementComparisonRowProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0">{label}</span>
      <div className="report-floor-track h-2.5 flex-1 overflow-hidden rounded-full">
        <div
          className={`${fillClassName} h-full rounded-full`}
          style={{ width: `${agreePercent}%` }}
        />
      </div>
      <span className="w-10 text-right font-bold tabular-nums">
        {agreePercent}%
      </span>
    </div>
  );
}

interface FavoriteStatementCardProps {
  statement: EventReportAttendeeStatement;
  posts: EventReportPost[];
}

function FavoriteStatementCard({
  statement,
  posts,
}: FavoriteStatementCardProps) {
  return (
    <div className="normal-bg dark-text flex flex-col gap-5 rounded-3xl p-7 md:p-9">
      <p className="report-label report-response-strong-text flex items-center gap-1.5 text-xs">
        <ResponseMark className="h-4 w-4 shrink-0" />
        The room's favorite idea
      </p>
      <p className="report-floor-quote">"{statement.text}"</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="min-w-48 flex-1">
          <VoteBar
            agreePercent={statement.agreePercent}
            disagreePercent={statement.disagreePercent}
          />
        </div>
        <span className="font-semibold">
          {statement.agreePercent}% agree
        </span>
        <span className="text-sm secondary-text-strong">
          {findPostTopic(posts, statement.postNumber)} ·{" "}
          {statement.voteCount} {pluralizeVote(statement.voteCount)}
        </span>
      </div>
    </div>
  );
}

interface AttendeeStatementListProps {
  statements: EventReportAttendeeStatement[];
  posts: EventReportPost[];
}

function RunnerUpStatements({
  statements,
  posts,
}: AttendeeStatementListProps) {
  if (statements.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold report-floor-subtext">
        And the rest of the top {statements.length + 1}
      </p>
      <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {statements.map((statement, index) => (
          <li
            key={statement.statementId}
            className="normal-bg dark-text flex flex-col gap-3 rounded-2xl p-5"
          >
            <span className="report-response-strong-text text-2xl font-extrabold">
              {index + 2}
            </span>
            <p className="flex-1 leading-snug">{statement.text}</p>
            <VoteBar
              agreePercent={statement.agreePercent}
              disagreePercent={statement.disagreePercent}
            />
            <span className="text-sm secondary-text-strong">
              {statement.agreePercent}% agree ·{" "}
              {findPostTopic(posts, statement.postNumber)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LowVoteStatements({
  statements,
  posts,
}: AttendeeStatementListProps) {
  if (statements.length === 0) return null;

  return (
    <div className="report-floor-border flex flex-col gap-3 border-t pt-6">
      <div>
        <p className="font-semibold">Also raised</p>
        <p className="text-sm report-floor-subtext">
          Added too late in a prompt to get many votes.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-3">
        {statements.map((statement) => (
          <li
            key={statement.statementId}
            className="report-floor-border flex flex-col gap-1 rounded-xl border px-4 py-3"
          >
            <span className="leading-snug">{statement.text}</span>
            <span className="text-sm report-floor-subtext">
              {findPostTopic(posts, statement.postNumber)} ·{" "}
              {statement.voteCount}{" "}
              {pluralizeVote(statement.voteCount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}