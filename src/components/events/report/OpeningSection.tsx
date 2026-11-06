import type { ReactNode } from "react";
import type { EventReportOpening } from "../../../types";
import {
  formatCount,
  formatSessionStart,
  getSessionMinutes,
} from "../../../utils/event-report";
import {
  pluralizeIdea,
  pluralizeMinute,
  pluralizePerson,
  pluralizePrompt,
  pluralizeVote,
} from "../../../utils/text";
import { ResponseMark } from "./ResponseMark";
import "./report.css";

interface OpeningSectionProps {
  opening: EventReportOpening;
}

export function OpeningSection({ opening }: OpeningSectionProps) {
  const sessionMinutes = getSessionMinutes(opening);
  const peopleAndMinutes = [
    `${opening.peopleCount} ${pluralizePerson(opening.peopleCount)}.`,
    `${sessionMinutes} ${pluralizeMinute(sessionMinutes)}.`,
  ].join(" ");

  return (
    <section className="dark-bg normal-text">
      <div className="report-section-content pb-16 pt-20">
        <p className="report-label text-sm report-subtext">
          {formatSessionStart(opening.sessionStartedAt)}
        </p>
        <h1 className="report-title max-w-4xl">{peopleAndMinutes}</h1>
        <p className="report-event-name max-w-3xl report-highlight-text">
          {opening.eventName}
        </p>
        {opening.eventSubtitle && (
          <p className="max-w-3xl text-lg report-subtext">
            {opening.eventSubtitle}
          </p>
        )}
        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
          <OpeningStat
            label={`${pluralizeVote(opening.voteCount)} cast`}
          >
            {formatCount(opening.voteCount)}
          </OpeningStat>
          <OpeningStat
            label={`${pluralizePrompt(opening.postCount)}, run live`}
          >
            {opening.postCount}
          </OpeningStat>
          <OpeningStat
            label={`${pluralizeIdea(opening.attendeeStatementCount)} added from the floor`}
          >
            {opening.attendeeStatementCount}
            <ResponseMark className="h-7 w-7 report-response-text" />
          </OpeningStat>
          <OpeningStat label="participation across prompts">
            {opening.averagePostParticipationPercent}%
          </OpeningStat>
        </div>
        <p className="flex items-center gap-2 text-sm report-subtext">
          <ResponseMark className="h-4 w-4 shrink-0 report-response-text" />
          This icon represents an idea added by a participant.
        </p>
      </div>
    </section>
  );
}

interface OpeningStatProps {
  label: string;
  children: ReactNode;
}

function OpeningStat({ label, children }: OpeningStatProps) {
  return (
    <div className="report-stat-border rounded-2xl border px-5 py-4">
      <p className="report-stat-value flex items-center gap-2.5">
        {children}
      </p>
      <p className="mt-1 text-sm report-subtext">{label}</p>
    </div>
  );
}