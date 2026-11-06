import { useState, type ReactNode } from "react";
import type {
  EventReportPost,
  EventReportStatement,
} from "../../../types";
import { findLongestPost } from "../../../utils/event-report";
import { formatElapsed } from "../../../utils/event-support";
import { pluralizePrompt } from "../../../utils/text";
import { ONE_SECOND_MS } from "../../../utils/time";
import { createAnalysisLink } from "../../../utils/url";
import { Button } from "../../ui/button";
import { SectionHeading } from "./SectionHeading";
import { ResponseMark } from "./ResponseMark";
import { VoteBar } from "./VoteBar";
import { REPORT_SECTION_IDS } from "./report-sections";
import "./report.css";

interface PromptsSectionProps {
  posts: EventReportPost[];
}

export function PromptsSection({ posts }: PromptsSectionProps) {
  const [selectedRoomId, setSelectedRoomId] = useState(
    () => findLongestPost(posts)?.roomId,
  );
  const selectedPost = posts.find(
    (post) => post.roomId === selectedRoomId,
  );
  if (!selectedPost) return null;

  const headline = [
    `You used ${posts.length} ${pluralizePrompt(posts.length)}`,
    "to guide the conversation",
  ].join(" ");

  return (
    <section
      id={REPORT_SECTION_IDS.prompts}
      className="normal-bg scroll-mt-16"
    >
      <div className="report-section-content py-16">
        <SectionHeading
          sectionName="Prompt by prompt"
          headline={headline}
          description="Pick one to see where the room agreed, where it split, and its best idea from the floor."
        />
        <div className="flex flex-wrap gap-2">
          {posts.map((post) => (
            <PromptPill
              key={post.roomId}
              post={post}
              isSelected={post.roomId === selectedPost.roomId}
              onSelect={() => setSelectedRoomId(post.roomId)}
            />
          ))}
        </div>
        <SelectedPromptPanel post={selectedPost} />
      </div>
    </section>
  );
}

interface PromptPillProps {
  post: EventReportPost;
  isSelected: boolean;
  onSelect: () => void;
}

function PromptPill({ post, isSelected, onSelect }: PromptPillProps) {
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      aria-pressed={isSelected}
      title={post.topic}
      onClick={onSelect}
      className="h-10 max-w-xs justify-start gap-1.5 rounded-full px-4 font-normal"
    >
      <span className="shrink-0 font-semibold">
        P{post.postNumber}
      </span>
      <span className="truncate">{post.topic}</span>
    </Button>
  );
}

interface SelectedPromptPanelProps {
  post: EventReportPost;
}

function SelectedPromptPanel({ post }: SelectedPromptPanelProps) {
  const timeOnScreen = formatElapsed(
    post.secondsOnPost * ONE_SECOND_MS,
  );

  return (
    <div className="report-panel-bg flex flex-col gap-5 rounded-3xl p-6 md:p-7">
      <div className="flex flex-col gap-1">
        <p className="text-sm secondary-text-strong">
          Prompt {post.postNumber} · {post.voterCount} voted ·{" "}
          {timeOnScreen} on screen
        </p>
        <h3 className="text-2xl font-bold leading-snug">
          {post.topic}
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <HighlightCard
          label="Most agreed"
          labelClassName="agree-text"
          statement={post.mostAgreedStatement}
          emptyText="No statements got votes on this prompt."
          renderCaption={(statement) => (
            <AgreeCaption statement={statement} />
          )}
        />
        <HighlightCard
          label="Most split"
          labelClassName="report-split-text"
          statement={post.mostSplitStatement}
          emptyText="No statements got votes on this prompt."
          renderCaption={(statement) => (
            <SplitCaption statement={statement} />
          )}
        />
        <HighlightCard
          label="Top idea from the floor"
          labelClassName="report-response-strong-text"
          backgroundClassName="report-response-bg"
          labelIcon={<ResponseMark className="h-4 w-4 shrink-0" />}
          statement={post.topAttendeeStatement}
          emptyText="Nobody added an idea on this prompt."
          renderCaption={(statement) => (
            <AttendeeCaption statement={statement} />
          )}
        />
      </div>
      <a
        href={createAnalysisLink(post.roomId)}
        className="self-start text-sm font-semibold underline underline-offset-4"
      >
        See the full analysis for this prompt
      </a>
    </div>
  );
}

interface HighlightCardProps {
  label: string;
  labelClassName: string;
  backgroundClassName?: string;
  labelIcon?: ReactNode;
  statement: EventReportStatement | null;
  emptyText: string;
  renderCaption: (statement: EventReportStatement) => ReactNode;
}

function HighlightCard({
  label,
  labelClassName,
  backgroundClassName = "normal-bg",
  labelIcon,
  statement,
  emptyText,
  renderCaption,
}: HighlightCardProps) {
  return (
    <div
      className={`${backgroundClassName} flex flex-col gap-3 rounded-2xl p-5`}
    >
      <p
        className={`${labelClassName} report-label flex items-center gap-1.5 text-xs`}
      >
        {labelIcon}
        {label}
      </p>
      {statement ? (
        <>
          <p className="flex-1 text-lg leading-snug">
            {statement.text}
          </p>
          <VoteBar
            agreePercent={statement.agreePercent}
            disagreePercent={statement.disagreePercent}
          />
          {renderCaption(statement)}
        </>
      ) : (
        <p className="flex-1 text-sm secondary-text">{emptyText}</p>
      )}
    </div>
  );
}

interface StatementCaptionProps {
  statement: EventReportStatement;
}

function AgreeCaption({ statement }: StatementCaptionProps) {
  return (
    <p className="text-sm secondary-text-strong">
      {statement.agreePercent}% agree
    </p>
  );
}

function AttendeeCaption({ statement }: StatementCaptionProps) {
  return (
    <p className="text-sm secondary-text-strong">
      Added by an attendee · {statement.agreePercent}% agree
    </p>
  );
}

function SplitCaption({ statement }: StatementCaptionProps) {
  return (
    <p className="flex justify-between text-sm secondary-text-strong">
      <span>{statement.agreePercent}% agree</span>
      <span>{statement.disagreePercent}% disagree</span>
    </p>
  );
}