import { cn } from "../../ui/utils";

interface OnboardingProgressSegmentsProps {
  segmentCount: number;
  filledSegmentCount: number;
  size: "large" | "small";
  className?: string;
}

export function OnboardingProgressSegments({
  segmentCount,
  filledSegmentCount,
  size,
  className,
}: OnboardingProgressSegmentsProps) {
  const segmentIndexes = Array.from({ length: segmentCount }, (_, index) => index);

  return (
    <div
      className={cn("grid", size === "large" ? "gap-1.5" : "gap-1", className)}
      style={{ gridTemplateColumns: `repeat(${segmentCount}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {segmentIndexes.map((segmentIndex) => (
        <div
          key={segmentIndex}
          className={cn(
            "rounded-full",
            size === "large" ? "h-2" : "h-1.5",
            segmentIndex < filledSegmentCount ? "dark-bg" : "progress-track-bg",
          )}
        />
      ))}
    </div>
  );
}
