import _ from "lodash";

interface FlyerProgressProps {
  votedCount: number;
  total: number;
}

const DONE_COLOR = "#E4603C";
const REMAINING_COLOR = "#E3DDD1";
const STEP_TITLES = [
  "Swipe to find your tribe",
  "Swipe to find your tribe",
  "Getting your initial vibe",
  "Reading the room",
  "Hunting for your tribe",
  "Almost there!",
];
const FINISHED_TITLE = "You found your tribe";

function stepTitle(votedCount: number, total: number): string {
  if (votedCount >= total) return FINISHED_TITLE;
  return STEP_TITLES[Math.min(votedCount, STEP_TITLES.length - 1)];
}

export function FlyerProgress({ votedCount, total }: FlyerProgressProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="truncate text-xl font-extrabold tracking-tight text-[#1C1B1F]">
          {stepTitle(votedCount, total)}
        </h2>
        <span className="shrink-0 text-sm font-semibold text-[#6B6760]">
          {votedCount} of {total}
        </span>
      </div>
      <div className="mt-2 flex gap-1.5">
        {_.times(total, (i) => (
          <ProgressSegment key={i} isDone={i < votedCount} isLatest={i === votedCount - 1} />
        ))}
      </div>
    </div>
  );
}

function ProgressSegment({ isDone, isLatest }: { isDone: boolean; isLatest: boolean }) {
  return (
    <div
      className="h-2 flex-1 rounded-full transition-colors duration-300"
      style={{
        backgroundColor: isDone ? DONE_COLOR : REMAINING_COLOR,
        boxShadow: isLatest ? `0 0 0 2px ${DONE_COLOR}40` : undefined,
      }}
    />
  );
}
