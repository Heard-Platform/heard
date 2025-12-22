import { MetricsCircle } from "../components/analysis/MetricsCircle";

export default {
  title: "MetricsCircle",
};

export function AllHighScores() {
  return (
    <div className="p-8 bg-gray-50">
      <h2 className="mb-4">All High Scores (3 rings lit)</h2>
      <MetricsCircle
        participation={0.85}
        consensus={0.92}
        spiciness={0.78}
        reach={0.88}
      />
    </div>
  );
}

export function AllMediumScores() {
  return (
    <div className="p-8 bg-gray-50">
      <h2 className="mb-4">All Medium Scores (2 rings lit)</h2>
      <MetricsCircle
        participation={0.45}
        consensus={0.55}
        spiciness={0.48}
        reach={0.52}
      />
    </div>
  );
}

export function AllLowScores() {
  return (
    <div className="p-8 bg-gray-50">
      <h2 className="mb-4">All Low Scores (1 ring lit)</h2>
      <MetricsCircle
        participation={0.12}
        consensus={0.18}
        spiciness={0.25}
        reach={0.15}
      />
    </div>
  );
}

export function MixedScores() {
  return (
    <div className="p-8 bg-gray-50">
      <h2 className="mb-4">Mixed Scores</h2>
      <MetricsCircle
        participation={0.85}
        consensus={0.45}
        spiciness={0.12}
        reach={0.78}
      />
    </div>
  );
}

export function EdgeCaseZeroScores() {
  return (
    <div className="p-8 bg-gray-50">
      <h2 className="mb-4">Zero Scores (0 rings lit)</h2>
      <MetricsCircle
        participation={0}
        consensus={0}
        spiciness={0}
        reach={0}
      />
    </div>
  );
}

export function ThresholdTesting() {
  return (
    <div className="p-8 bg-gray-50 space-y-8">
      <div>
        <h2 className="mb-4">Just Below 0.33 (1 ring lit)</h2>
        <MetricsCircle
          participation={0.32}
          consensus={0.32}
          spiciness={0.32}
          reach={0.32}
        />
      </div>
      <div>
        <h2 className="mb-4">Just At 0.33 (2 rings lit)</h2>
        <MetricsCircle
          participation={0.33}
          consensus={0.33}
          spiciness={0.33}
          reach={0.33}
        />
      </div>
      <div>
        <h2 className="mb-4">Just Below 0.66 (2 rings lit)</h2>
        <MetricsCircle
          participation={0.65}
          consensus={0.65}
          spiciness={0.65}
          reach={0.65}
        />
      </div>
      <div>
        <h2 className="mb-4">Just At 0.66 (3 rings lit)</h2>
        <MetricsCircle
          participation={0.66}
          consensus={0.66}
          spiciness={0.66}
          reach={0.66}
        />
      </div>
    </div>
  );
}

export const MetricsCircleStory = () => {
  return (
    <>
      <AllHighScores />
      <AllMediumScores />
      <AllLowScores />
      <MixedScores />
      <EdgeCaseZeroScores />
      <ThresholdTesting />
    </>
  )
};