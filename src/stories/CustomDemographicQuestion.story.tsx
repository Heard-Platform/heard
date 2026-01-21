import { useState } from "react";
import { CustomDemographicQuestion } from "../components/create-room/CustomDemographicQuestion";

export function CustomDemographicQuestionStory() {
  const [questionText, setQuestionText] = useState("What neighborhood do you live in?");
  const [options, setOptions] = useState(["Downtown", "Midtown", "Uptown"]);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Custom Demographic Question</h2>
        <p className="text-slate-600 mb-6">
          Component for creating custom demographic questions with single-choice answers.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Interactive Example</h3>
          <CustomDemographicQuestion
            questionText={questionText}
            options={options}
            onQuestionTextChange={setQuestionText}
            onOptionsChange={setOptions}
            onRemove={() => console.log("Remove clicked")}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Empty State</h3>
          <CustomDemographicQuestion
            questionText=""
            options={[]}
            onQuestionTextChange={() => {}}
            onOptionsChange={() => {}}
            onRemove={() => console.log("Remove clicked")}
          />
        </div>

        <div className="p-4 bg-slate-100 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Current State:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ questionText, options }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
