import { SettingCheckbox } from "../widgets/SettingCheckbox";
import { AdvancedFeatures } from "./AdvancedFeatures";
import type { NewDemographicQuestion } from "../../types";
import { FeatureFlags, isFeatureEnabled } from "../../utils/constants/feature-flags";

interface AdvancedSettingsProps {
  allowAnonymousVoting: boolean;
  requiresStatementApproval: boolean;
  demographicQuestions: NewDemographicQuestion[];
  onAllowAnonymousVotingChange: (value: boolean) => void;
  onRequiresStatementApprovalChange: (value: boolean) => void;
  onDemographicQuestionsChange: (questions: NewDemographicQuestion[]) => void;
}

export function AdvancedSettings({
  allowAnonymousVoting,
  requiresStatementApproval,
  demographicQuestions,
  onAllowAnonymousVotingChange,
  onRequiresStatementApprovalChange,
  onDemographicQuestionsChange,
}: AdvancedSettingsProps) {
  const handleRequireAccountChange = (isAccountRequired: boolean) =>
    onAllowAnonymousVotingChange(!isAccountRequired);

  return (
    <div className="space-y-4">
      {isFeatureEnabled(FeatureFlags.DEMOGRAPHICS) && (
        <AdvancedFeatures
          collapsible={false}
          demographicQuestions={demographicQuestions}
          onDemographicQuestionsChange={onDemographicQuestionsChange}
        />
      )}
      <SettingCheckbox
        id="require-account"
        title="Require an account to vote"
        description="Enable to require users to make accounts prior to voting. Off by default so anyone with the link can vote right away."
        isChecked={!allowAnonymousVoting}
        onCheckedChange={handleRequireAccountChange}
      />
      {isFeatureEnabled(FeatureFlags.STATEMENT_APPROVAL) && (
        <SettingCheckbox
          id="require-statement-approval"
          title="Approve statements before they show"
          description="New statements stay hidden until approved."
          isChecked={requiresStatementApproval}
          onCheckedChange={onRequiresStatementApprovalChange}
        />
      )}
    </div>
  );
}
