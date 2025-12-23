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
        size={200}
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
        size={200}
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
        size={200}
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
        size={200}
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
        size={200}
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
          size={200}
        />
      </div>
      <div>
        <h2 className="mb-4">Just At 0.33 (2 rings lit)</h2>
        <MetricsCircle
          participation={0.33}
          consensus={0.33}
          spiciness={0.33}
          reach={0.33}
          size={200}
        />
      </div>
      <div>
        <h2 className="mb-4">Just Below 0.66 (2 rings lit)</h2>
        <MetricsCircle
          participation={0.65}
          consensus={0.65}
          spiciness={0.65}
          reach={0.65}
          size={200}
        />
      </div>
      <div>
        <h2 className="mb-4">Just At 0.66 (3 rings lit)</h2>
        <MetricsCircle
          participation={0.66}
          consensus={0.66}
          spiciness={0.66}
          reach={0.66}
          size={200}
        />
      </div>
    </div>
  );
}

export const MetricsCircleStory = () => {
  return (
    <>
      <h2 className="p-8 pb-0">Different Sizes</h2>
      <div className="p-8 bg-gray-50 flex items-center gap-8">
        <div>
          <p className="mb-2 text-sm">Small (25px)</p>
          <MetricsCircle
            participation={0.85}
            consensus={0.45}
            spiciness={0.12}
            reach={0.78}
            size={25}
          />
        </div>
        <div>
          <p className="mb-2 text-sm">Medium (100px)</p>
          <MetricsCircle
            participation={0.85}
            consensus={0.45}
            spiciness={0.12}
            reach={0.78}
            size={100}
          />
        </div>
        <div>
          <p className="mb-2 text-sm">Large (200px)</p>
          <MetricsCircle
            participation={0.85}
            consensus={0.45}
            spiciness={0.12}
            reach={0.78}
            size={200}
          />
        </div>
      </div>
      <AllHighScores />
      <AllMediumScores />
      <AllLowScores />
      <MixedScores />
      <EdgeCaseZeroScores />
      <ThresholdTesting />
    </>
  )
};