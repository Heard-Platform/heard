import { useEffect, useState } from "react";
import type { FeedbackCardResults } from "../../../types";
import { api } from "../../../utils/api";
import { FeedbackCardsTab } from "./FeedbackCardsTab";

export function FeedbackCardsTabContainer() {
  const [results, setResults] = useState<FeedbackCardResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api.getFeedbackCardResults().then((response) => {
      if (cancelled) return;
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error ?? "Failed to load feedback card results");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!results) {
    return <p className="text-center text-muted-foreground py-8">Loading feedback cards...</p>;
  }

  return <FeedbackCardsTab results={results} />;
}
