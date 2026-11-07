import { useState } from "react";
import { AdvancedSettings } from "../components/create-room/AdvancedSettings";
import type { NewDemographicQuestion } from "../types";

export function AdvancedSettingsStory() {
  const [allowAnonymousVoting, setAllowAnonymousVoting] =
    useState(true);
  const [requiresStatementApproval, setRequiresStatementApproval] =
    useState(false);
  const [demographicQuestions, setDemographicQuestions] = useState<
    NewDemographicQuestion[]
  >([]);

  const settings = {
    allowAnonymousVoting,
    requiresStatementApproval,
    demographicQuestions,
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Advanced Settings</h2>
        <p className="text-slate-600">
          Post creation settings: demographic questions, requiring an
          account to vote, and approving statements before they show.
          Both checkboxes start off, as in post creation.
        </p>
      </div>

      <AdvancedSettings
        allowAnonymousVoting={allowAnonymousVoting}
        requiresStatementApproval={requiresStatementApproval}
        demographicQuestions={demographicQuestions}
        onAllowAnonymousVotingChange={setAllowAnonymousVoting}
        onRequiresStatementApprovalChange={
          setRequiresStatementApproval
        }
        onDemographicQuestionsChange={setDemographicQuestions}
      />

      <div className="p-4 bg-slate-100 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">
          Current settings:
        </h3>
        <pre className="text-xs overflow-auto max-h-96">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
}
