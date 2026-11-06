import type { ReactNode } from "react";
import type {
  EventReportPost,
  EventReportTimeline,
} from "../../../types";
import {
  buildTimelineColumns,
  findBiggestAttendeeStatementBump,
  findBusiestBin,
  findPostNumberAtSecond,
  findQuietestBin,
  formatSessionClock,
  type TimelineColumn,
} from "../../../utils/event-report";
import { pluralizePerson } from "../../../utils/text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";
import { REPORT_SECTION_IDS } from "./report-sections";
import { ResponseMark } from "./ResponseMark";
import { SectionHeading } from "./SectionHeading";
import "./report.css";

const CLOCK_TICK_SECONDS = 10 * 60;

const TIMELINE_DESCRIPTION =
  "People voting in every 20 seconds of the session. A line marks each new prompt, and the icon marks each idea added from the floor. Hover over any of them for more.";

interface TimelineSectionProps {
  timeline: EventReportTimeline;
  posts: EventReportPost[];
  sessionStartedAt: number;
}

export function TimelineSection({
  timeline,
  posts,
  sessionStartedAt,
}: TimelineSectionProps) {
  const busiestBin = findBusiestBin(timeline.bins);
  if (!busiestBin) return null;

  const headline = [
    `At the busiest moment, ${busiestBin.activeVoterCount}`,
    `${pluralizePerson(busiestBin.activeVoterCount)} were voting at once.`,
  ].join(" ");

  return (
    <section
      id={REPORT_SECTION_IDS.timeline}
      className="normal-bg scroll-mt-16"
    >
      <div className="report-section-content py-16">
        <SectionHeading
          sectionNumber={7}
          sectionName="Minute by minute"
          headline={headline}
          description={TIMELINE_DESCRIPTION}
        />
        <div className="report-panel-bg flex flex-col gap-3 rounded-3xl p-6">
          <TimelineLegend />
          <TimelineChart
            timeline={timeline}
            posts={posts}
            sessionStartedAt={sessionStartedAt}
          />
        </div>
        <TimelineCallouts
          timeline={timeline}
          sessionStartedAt={sessionStartedAt}
        />
      </div>
    </section>
  );
}

function TimelineLegend() {
  return (
    <div className="flex flex-wrap justify-between gap-2 text-sm secondary-text-strong">
      <span className="font-semibold dark-text">
        People voting, every 20 seconds
      </span>
      <span className="flex flex-wrap gap-4">
        <span className="flex items-center gap-1.5">
          <span className="report-timeline-prompt-start h-3.5 border-l-2" />
          New prompt
        </span>
        <span className="flex items-center gap-1.5">
          <ResponseMark className="h-3.5 w-3.5 report-response-strong-text" />
          Idea added from the floor
        </span>
      </span>
    </div>
  );
}

interface TimelineChartProps {
  timeline: EventReportTimeline;
  posts: EventReportPost[];
  sessionStartedAt: number;
}

function TimelineChart({
  timeline,
  posts,
  sessionStartedAt,
}: TimelineChartProps) {
  const columns = buildTimelineColumns(timeline);
  const lastColumn = columns[columns.length - 1];
  const sessionSeconds =
    lastColumn.secondsSinceStart + timeline.binSeconds;
  const clockTickSeconds = listClockTickSeconds(sessionSeconds);
  const findTopic = (postNumber: number) =>
    posts.find((post) => post.postNumber === postNumber)?.topic ?? "";

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div className="flex min-w-[56rem] flex-col gap-1">
        <div className="flex items-stretch">
          {columns.map((column) => (
            <TimelineColumnBar
              key={column.secondsSinceStart}
              column={column}
              clockTime={formatSessionClock(
                sessionStartedAt,
                column.secondsSinceStart,
              )}
              findTopic={findTopic}
            />
          ))}
        </div>
        <div className="relative h-5 border-t text-xs secondary-text">
          {clockTickSeconds.map((tickSeconds) => (
            <span
              key={tickSeconds}
              className="absolute top-1 -translate-x-1/2 first:translate-x-0"
              style={{
                left: `${(tickSeconds / sessionSeconds) * 100}%`,
              }}
            >
              {formatSessionClock(sessionStartedAt, tickSeconds)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function listClockTickSeconds(sessionSeconds: number): number[] {
  const tickCount =
    Math.floor(sessionSeconds / CLOCK_TICK_SECONDS) + 1;
  return Array.from(
    { length: tickCount },
    (_, tickIndex) => tickIndex * CLOCK_TICK_SECONDS,
  );
}

interface TimelineColumnBarProps {
  column: TimelineColumn;
  clockTime: string;
  findTopic: (postNumber: number) => string;
}

function TimelineColumnBar({
  column,
  clockTime,
  findTopic,
}: TimelineColumnBarProps) {
  const barClassName =
    (column.postNumber ?? 0) % 2 === 0
      ? "report-timeline-alternate-bar"
      : "report-timeline-bar";
  const barTooltip = [
    clockTime,
    `prompt ${column.postNumber ?? 1}`,
    `about ${column.activeVoterCount} voting`,
  ].join(" · ");

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      {column.startingPostNumber !== undefined && (
        <PromptStartLine
          postNumber={column.startingPostNumber}
          topic={findTopic(column.startingPostNumber)}
        />
      )}
      <div className="flex h-5 items-end justify-center">
        {column.attendeeStatements.length > 0 && (
          <ResponseMark
            className="h-3 w-3 report-response-strong-text"
            tooltipContent={
              <AttendeeStatementsTooltip
                attendeeStatements={column.attendeeStatements}
              />
            }
          />
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-48 items-end px-px">
            <div
              className={`${barClassName} w-full rounded-t-sm`}
              style={{ height: `${column.heightPercent}%` }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>{barTooltip}</TooltipContent>
      </Tooltip>
      <div className="h-4 pl-1 text-xs font-semibold">
        {column.startingPostNumber ?? ""}
      </div>
    </div>
  );
}

interface PromptStartLineProps {
  postNumber: number;
  topic: string;
}

function PromptStartLine({
  postNumber,
  topic,
}: PromptStartLineProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={`Prompt ${postNumber}: ${topic}`}
          className="absolute inset-y-0 left-0 z-10 flex w-2.5 -translate-x-1/2 justify-center"
        >
          <span className="report-timeline-prompt-start h-full border-l-2" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        Prompt {postNumber}: {topic}
      </TooltipContent>
    </Tooltip>
  );
}

interface AttendeeStatementsTooltipProps {
  attendeeStatements: TimelineColumn["attendeeStatements"];
}

function AttendeeStatementsTooltip({
  attendeeStatements,
}: AttendeeStatementsTooltipProps) {
  return (
    <span className="flex max-w-xs flex-col gap-1">
      {attendeeStatements.map((attendeeStatement) => (
        <span key={attendeeStatement.statementId}>
          "{attendeeStatement.text}"
        </span>
      ))}
    </span>
  );
}

interface TimelineCalloutsProps {
  timeline: EventReportTimeline;
  sessionStartedAt: number;
}

function TimelineCallouts({
  timeline,
  sessionStartedAt,
}: TimelineCalloutsProps) {
  const busiestBin = findBusiestBin(timeline.bins);
  const quietestBin = findQuietestBin(timeline.bins);
  const biggestBump = findBiggestAttendeeStatementBump(timeline);
  const findPostNumber = (secondsSinceStart: number) =>
    findPostNumberAtSecond(timeline.promptStarts, secondsSinceStart);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {busiestBin && (
        <TimelineCallout label="Busiest moment">
          {[
            `${busiestBin.activeVoterCount}`,
            `${pluralizePerson(busiestBin.activeVoterCount)} voting at`,
            `once, during prompt`,
            `${findPostNumber(busiestBin.secondsSinceStart)}.`,
          ].join(" ")}
        </TimelineCallout>
      )}
      {biggestBump && (
        <TimelineCallout
          label="Biggest bump from the floor"
          labelIcon={
            <ResponseMark className="h-3.5 w-3.5 report-response-strong-text" />
          }
        >
          {[
            `"${biggestBump.attendeeStatement.text}" pulled`,
            `${biggestBump.addedVoterCount} more`,
            `${pluralizePerson(biggestBump.addedVoterCount)} in.`,
          ].join(" ")}
        </TimelineCallout>
      )}
      {quietestBin && (
        <TimelineCallout label="Quietest stretch">
          {[
            `${formatSessionClock(sessionStartedAt, quietestBin.secondsSinceStart)},`,
            `during prompt`,
            `${findPostNumber(quietestBin.secondsSinceStart)}.`,
          ].join(" ")}
        </TimelineCallout>
      )}
    </div>
  );
}

interface TimelineCalloutProps {
  label: string;
  labelIcon?: ReactNode;
  children: ReactNode;
}

function TimelineCallout({
  label,
  labelIcon,
  children,
}: TimelineCalloutProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border px-5 py-4">
      <span className="flex items-center gap-1.5 text-sm secondary-text">
        {labelIcon}
        {label}
      </span>
      <span className="leading-snug">{children}</span>
    </div>
  );
}