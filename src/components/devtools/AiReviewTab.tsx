import { ClusterNamesReview } from "./ai-review/ClusterNamesReview";

export function AiReviewTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">AI Review</h2>
        <p className="text-sm text-slate-600">
          Review AI-generated results before and after they reach users
        </p>
      </div>
      <ClusterNamesReview />
    </div>
  );
}
