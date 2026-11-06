import type { ReactNode } from "react";
import type { EventReportPost } from "../../../types";
import { formatElapsed } from "../../../utils/event-support";
import {
  findLongestPost,
  getAverageVoterCount,
} from "../../../utils/event-report";
import { pluralizePerson } from "../../../utils/text";
import { ONE_SECOND_MS } from "../../../utils/time";
import {
  TimePerPostChart,
  VotedOnEachPostChart,
} from "../support/SupportCharts";
import { ChapterHeading } from "./ChapterHeading";
import "./report.css";

interface TimeSectionProps {
  posts: EventReportPost[];
  peopleCount: number;
}

export function TimeSection({
  posts,
  peopleCount,
}: TimeSectionProps) {
  const longestPost = findLongestPost(posts);
  if (!longestPost) return null;

  const longestPostTime = formatElapsed(
    longestPost.secondsOnPost * ONE_SECOND_MS,
  );
  const averageVoters = [
    `On average, ${getAverageVoterCount(posts)} of ${peopleCount}`,
    `${pluralizePerson(peopleCount)} voted on each prompt.`,
  ].join(" ");

  return (
    <section className="report-chapter-bg">
      <div className="report-section-content py-16">
        <ChapterHeading
          chapterNumber={1}
          chapterName="How the time went"
          headline={`You talked longest about "${longestPost.topic}"`}
          description={`${longestPostTime} on prompt ${longestPost.postNumber}, more than any other prompt.`}
        />
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <ChartCard title="Minutes on each prompt">
            <TimePerPostChart
              postsSoFar={posts}
              highlightedPostNumber={longestPost.postNumber}
            />
          </ChartCard>
          <ChartCard title="Number of people who voted">
            <VotedOnEachPostChart
              postsSoFar={posts}
              highlightedPostNumber={null}
            />
            <p className="text-sm secondary-text-strong">
              {averageVoters}
            </p>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="normal-bg flex flex-col gap-4 rounded-2xl p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}