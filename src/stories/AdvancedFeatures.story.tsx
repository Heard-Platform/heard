import { useState } from "react";
import { AdvancedFeatures } from "../components/create-room/AdvancedFeatures";
import type { DemographicQuestion } from "../types";

export function AdvancedFeaturesStory() {
  const [demographicQuestions, setDemographicQuestions] = useState<DemographicQuestion[]>([]);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Advanced Features</h2>
        <p className="text-slate-600 mb-6">
          Expandable section for advanced room creation features, including demographic questions.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Interactive Example</h3>
          <AdvancedFeatures
            demographicQuestions={demographicQuestions}
            onDemographicQuestionsChange={setDemographicQuestions}
          />
        </div>

        <div className="p-4 bg-slate-100 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Current Questions:</h3>
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(demographicQuestions, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
