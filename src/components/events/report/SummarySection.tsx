import type { ReactNode } from "react";
import type { EventReport } from "../../../types";
import { CALENDLY_INTRO_CALL_URL } from "../../../utils/constants/links";
import {
  findLongestPost,
  findMostAgreedStatement,
  findMostSplitStatement,
  formatCount,
} from "../../../utils/event-report";
import { formatElapsed } from "../../../utils/event-support";
import { ONE_SECOND_MS } from "../../../utils/time";
import { REPORT_SECTION_IDS } from "./report-sections";
import { ResponseMark } from "./ResponseMark";
import { ShareButton } from "./ShareButton";
import "./report.css";

interface SummarySectionProps {
  report: EventReport;
}

export function SummarySection({ report }: SummarySectionProps) {
  return (
    <section
      id={REPORT_SECTION_IDS.summary}
      className="report-section-bg scroll-mt-16"
    >
      <div className="report-section-content py-20">
        <div className="flex flex-col gap-2">
          <p className="report-label text-xs opacity-70">Summary</p>
          <h2 className="report-header">The session on one page</h2>
        </div>
        <SummaryStats report={report} />
        <SummaryTakeaways report={report} />
        <CallToAction />
      </div>
    </section>
  );
}

function SummaryStats({ report }: SummarySectionProps) {
  const { opening, campAnalysis } = report;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
      <SummaryStat
        value={String(opening.peopleCount)}
        label="people"
      />
      <SummaryStat
        value={formatCount(opening.voteCount)}
        label="votes"
      />
      <SummaryStat
        value={String(opening.attendeeStatementCount)}
        valueIcon={
          <ResponseMark className="h-6 w-6 report-response-strong-text" />
        }
        label="ideas from the floor"
      />
      <SummaryStat
        value={`${opening.averagePostParticipationPercent}%`}
        label="participation across prompts"
      />
      {campAnalysis.camps.length > 0 && (
        <SummaryStat
          value={String(campAnalysis.camps.length)}
          label="camps in the room"
        />
      )}
    </div>
  );
}

interface SummaryStatProps {
  value: string;
  valueIcon?: ReactNode;
  label: string;
}

function SummaryStat({ value, valueIcon, label }: SummaryStatProps) {
  return (
    <div className="normal-bg rounded-2xl px-5 py-4">
      <p className="flex items-center gap-2 text-3xl font-extrabold tabular-nums">
        {value}
        {valueIcon}
      </p>
      <p className="text-sm secondary-text-strong">{label}</p>
    </div>
  );
}

function SummaryTakeaways({ report }: SummarySectionProps) {
  const mostAgreed = findMostAgreedStatement(report.posts);
  const mostSplit = findMostSplitStatement(report.posts);
  const [floorFavorite] = report.floor.topAttendeeStatements;
  const longestPost = findLongestPost(report.posts);

  return (
    <ul className="flex flex-col">
      {mostAgreed && (
        <SummaryTakeaway
          label="The room agreed"
          labelClassName="agree-text"
          value={`${mostAgreed.statement.agreePercent}%`}
        >
          {mostAgreed.statement.text}
        </SummaryTakeaway>
      )}
      {mostSplit && (
        <SummaryTakeaway
          label="The room split"
          labelClassName="report-split-text"
          value={`${mostSplit.statement.agreePercent} / ${mostSplit.statement.disagreePercent}`}
        >
          {mostSplit.statement.text}
        </SummaryTakeaway>
      )}
      {floorFavorite && (
        <SummaryTakeaway
          label="Floor favorite"
          labelClassName="report-response-strong-text"
          labelIcon={
            <ResponseMark className="h-3.5 w-3.5 shrink-0" />
          }
          value={`${floorFavorite.agreePercent}%`}
        >
          {floorFavorite.text}
        </SummaryTakeaway>
      )}
      {longestPost && (
        <SummaryTakeaway
          label="Longest discussion"
          labelClassName="secondary-text-strong"
          value={formatElapsed(
            longestPost.secondsOnPost * ONE_SECOND_MS,
          )}
        >
          {longestPost.topic}
        </SummaryTakeaway>
      )}
    </ul>
  );
}

interface SummaryTakeawayProps {
  label: string;
  labelClassName: string;
  labelIcon?: ReactNode;
  value: string;
  children: ReactNode;
}

function SummaryTakeaway({
  label,
  labelClassName,
  labelIcon,
  value,
  children,
}: SummaryTakeawayProps) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b py-4">
      <span
        className={`${labelClassName} report-label flex w-44 shrink-0 items-center gap-1.5 text-xs`}
      >
        {labelIcon}
        {label}
      </span>
      <span className="min-w-0 flex-[1_1_20rem] text-lg leading-snug">
        {children}
      </span>
      <span className="text-sm tabular-nums secondary-text-strong">
        {value}
      </span>
    </li>
  );
}

function CallToAction() {
  return (
    <div className="dark-bg normal-text flex flex-wrap items-center justify-between gap-6 rounded-3xl p-8 md:p-10">
      <div className="flex max-w-xl flex-col gap-2">
        <h3 className="text-3xl font-bold leading-tight">
          Run Heard at your next event
        </h3>
        <p className="report-subtext leading-relaxed">
          Your attendees write the statements, the whole room votes,
          and the results go up on screen live. You get a report like
          this one afterward.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <a
          href={CALENDLY_INTRO_CALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="report-call-to-action-button flex h-12 items-center rounded-full px-6 font-semibold"
        >
          Talk to us
        </a>
        <ShareButton
          variant="ghost"
          className="report-stat-border h-12 border"
        />
      </div>
    </div>
  );
}