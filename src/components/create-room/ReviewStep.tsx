import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { DebateLengthPicker } from "../widgets/DebateLengthPicker";
import type { Cover, NewDemographicQuestion } from "../../types";
import { HotTakesList } from "./HotTakesList";
import { CreationSettingsPanel, type CreationSetting } from "./CreationSettingsPanel";
import { CreationSettingSheet } from "./CreationSettingSheet";
import { CoverPicker } from "./CoverPicker";
import { AdvancedSettings } from "./AdvancedSettings";
import { SelectCommunityStep } from "./SelectCommunityStep";
import { canCreatePost, dropBlankCustomQuestions, hasIncompleteCustomQuestion } from "./create-post-utils";

const SETTING_TITLES: Record<CreationSetting, string> = {
  community: "Community",
  cover: "Cover card",
  length: "Length",
  advanced: "Advanced",
};

interface ReviewStepProps {
  topic: string;
  description: string;
  hotTakes: string[];
  subHeard: string;
  defaultSubHeard?: string;
  userId: string;
  hideCommunity?: boolean;
  cover: Cover | null;
  isUploadingImage?: boolean;
  debateLength: number;
  allowAnonymousVoting: boolean;
  demographicQuestions: NewDemographicQuestion[];
  isCreating?: boolean;
  autoFocusAddTake?: boolean;
  initialOpenSetting?: CreationSetting | null;
  onTopicChange: (topic: string) => void;
  onDescriptionChange: (description: string) => void;
  onHotTakesChange: (takes: string[]) => void;
  onSubHeardChange: (subHeard: string) => void;
  onImageUpload: (file: File) => void;
  onCoverChange: (cover: Cover | null) => void;
  onDebateLengthChange: (minutes: number) => void;
  onAllowAnonymousVotingChange: (value: boolean) => void;
  onDemographicQuestionsChange: (questions: NewDemographicQuestion[]) => void;
  onCreate: () => void;
}

export function ReviewStep({
  topic,
  description,
  hotTakes,
  subHeard,
  defaultSubHeard,
  userId,
  hideCommunity = false,
  cover,
  isUploadingImage,
  debateLength,
  allowAnonymousVoting,
  demographicQuestions,
  isCreating = false,
  autoFocusAddTake = false,
  initialOpenSetting = null,
  onTopicChange,
  onDescriptionChange,
  onHotTakesChange,
  onSubHeardChange,
  onImageUpload,
  onCoverChange,
  onDebateLengthChange,
  onAllowAnonymousVotingChange,
  onDemographicQuestionsChange,
  onCreate,
}: ReviewStepProps) {
  const [openSetting, setOpenSetting] = useState<CreationSetting | null>(initialOpenSetting);
  const [showDescription, setShowDescription] = useState(description.length > 0);

  const needsCommunity = !hideCommunity;
  const incompleteQuestion = hasIncompleteCustomQuestion(demographicQuestions);
  const canCreate = !incompleteQuestion && canCreatePost({ topic, hotTakes, subHeard, needsCommunity });
  const onlyMissingCommunity =
    !incompleteQuestion &&
    !canCreatePost({ topic, hotTakes, subHeard, needsCommunity }) &&
    canCreatePost({ topic, hotTakes, subHeard, needsCommunity: false });
  const advancedCount = demographicQuestions.length + (allowAnonymousVoting ? 0 : 1);

  const closeSetting = (open: boolean) => {
    if (open) return;
    if (openSetting === "advanced") {
      const kept = dropBlankCustomQuestions(demographicQuestions);
      if (kept.length !== demographicQuestions.length) onDemographicQuestionsChange(kept);
    }
    setOpenSetting(null);
  };

  const handlePickCommunity = (name: string) => {
    onSubHeardChange(name);
    setOpenSetting(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <label htmlFor="post-topic" className="text-[13px] font-semibold secondary-text-strong">
            Topic
          </label>
          {!showDescription && (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="creation-strong-text flex items-center gap-1 text-xs font-semibold"
            >
              <Plus className="size-3" />
              Add description
            </button>
          )}
        </div>
        <textarea
          id="post-topic"
          value={topic}
          rows={1}
          maxLength={200}
          placeholder="What's the conversation about?"
          onChange={(e) => onTopicChange(e.target.value)}
          className="field-sizing-content max-h-24 min-h-11 resize-none rounded-xl border-[1.5px] normal-border bg-white px-3 py-2.5 text-base leading-snug font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground creation-input"
        />
        {showDescription && (
          <>
            <label htmlFor="post-description" className="sr-only">
              Description (optional)
            </label>
            <textarea
              id="post-description"
              value={description}
              rows={1}
              maxLength={500}
              autoFocus={description.length === 0}
              placeholder="Description (optional)"
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="field-sizing-content max-h-20 min-h-10 resize-none rounded-xl border normal-border bg-white px-3 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground creation-input"
            />
          </>
        )}
      </div>

      <div className="flex shrink-0 items-baseline gap-2 pt-0.5">
        <span className="text-[13px] font-semibold secondary-text-strong">Hot Takes</span>
        <span className="text-xs secondary-text-strong">People will vote agree or disagree on these</span>
      </div>
      <HotTakesList takes={hotTakes} autoFocusAdd={autoFocusAddTake} onTakesChange={onHotTakesChange} />

      <CreationSettingsPanel
        subHeard={subHeard}
        hideCommunity={hideCommunity}
        hasCover={!!cover}
        debateLength={debateLength}
        advancedCount={advancedCount}
        advancedIncomplete={incompleteQuestion}
        onOpenSetting={setOpenSetting}
      />

      <Button
        type="button"
        onClick={onCreate}
        disabled={!canCreate || isCreating}
        className={`h-13 shrink-0 rounded-2xl text-[17px] font-bold disabled:opacity-100 ${
          canCreate ? "creation-solid-bg" : "inactive-bg secondary-text-strong"
        }`}
      >
        {isCreating ? "Creating..." : onlyMissingCommunity ? "Pick a community to post" : "Create post"}
      </Button>

      <CreationSettingSheet
        open={openSetting !== null}
        title={openSetting ? SETTING_TITLES[openSetting] : ""}
        onOpenChange={closeSetting}
      >
        {openSetting === "community" && (
          <SelectCommunityStep
            subHeard={subHeard}
            defaultSubHeard={defaultSubHeard}
            userId={userId}
            onSubHeardChange={handlePickCommunity}
          />
        )}
        {openSetting === "cover" && (
          <CoverPicker
            cover={cover}
            isUploadingImage={isUploadingImage}
            onImageUpload={onImageUpload}
            onCoverChange={onCoverChange}
          />
        )}
        {openSetting === "length" && (
          <DebateLengthPicker debateLength={debateLength} onDebateLengthChange={onDebateLengthChange} />
        )}
        {openSetting === "advanced" && (
          <AdvancedSettings
            allowAnonymousVoting={allowAnonymousVoting}
            demographicQuestions={demographicQuestions}
            onAllowAnonymousVotingChange={onAllowAnonymousVotingChange}
            onDemographicQuestionsChange={onDemographicQuestionsChange}
          />
        )}
      </CreationSettingSheet>
    </div>
  );
}
