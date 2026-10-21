import { Checkbox } from "../ui/checkbox";
import { AdvancedFeatures } from "./AdvancedFeatures";
import type { NewDemographicQuestion } from "../../types";
import { FeatureFlags, isFeatureEnabled } from "../../utils/constants/feature-flags";

interface AdvancedSettingsProps {
  allowAnonymousVoting: boolean;
  demographicQuestions: NewDemographicQuestion[];
  onAllowAnonymousVotingChange: (value: boolean) => void;
  onDemographicQuestionsChange: (questions: NewDemographicQuestion[]) => void;
}

export function AdvancedSettings({
  allowAnonymousVoting,
  demographicQuestions,
  onAllowAnonymousVotingChange,
  onDemographicQuestionsChange,
}: AdvancedSettingsProps) {
  return (
    <div className="space-y-4">
      {isFeatureEnabled(FeatureFlags.DEMOGRAPHICS) && (
        <AdvancedFeatures
          collapsible={false}
          demographicQuestions={demographicQuestions}
          onDemographicQuestionsChange={onDemographicQuestionsChange}
        />
      )}
      <label
        htmlFor="require-account"
        className="flex cursor-pointer items-center gap-3 rounded-xl border inactive-border px-3 py-2.5"
      >
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-foreground">Require an account to vote</span>
          <span className="text-[13px] leading-snug secondary-text-strong">
            Enable to require users to make accounts prior to voting. Off by default so anyone with the link can vote right away.
          </span>
        </span>
        <Checkbox
          id="require-account"
          checked={!allowAnonymousVoting}
          onCheckedChange={(checked: boolean) => onAllowAnonymousVotingChange(!checked)}
          className="size-5"
        />
      </label>
    </div>
  );
}
