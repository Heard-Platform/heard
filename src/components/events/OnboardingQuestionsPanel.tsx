import { ChevronDown, ChevronUp, ClipboardList, Plus } from "lucide-react";
import type { EventOnboardingQuestionDraft } from "../../types";
import {
  createBlankEventOnboardingQuestionDraft,
  EVENT_ONBOARDING_MINIMUM_OPTION_COUNT,
  isDuplicateQuestionText,
  moveEventOnboardingQuestionDraft,
} from "../../utils/event-onboarding-questions";
import { OPT_OUT_ANSWER } from "../../utils/demographic-questions";
import { CustomDemographicQuestion } from "../create-room/CustomDemographicQuestion";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface OnboardingQuestionsPanelProps {
  questionDrafts: EventOnboardingQuestionDraft[];
  isLocked: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  canSave: boolean;
  onQuestionDraftsChange: (questionDrafts: EventOnboardingQuestionDraft[]) => void;
  onSave: () => void;
}

export function OnboardingQuestionsPanel({
  questionDrafts,
  isLocked,
  isSaving,
  hasUnsavedChanges,
  canSave,
  onQuestionDraftsChange,
  onSave,
}: OnboardingQuestionsPanelProps) {
  return (
    <Card className="heard-card-bg overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="space-y-0.5">
          <h3 className="font-bold text-foreground flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4" /> Onboarding questions
          </h3>
          <p className="text-sm text-muted-foreground">
            {isLocked
              ? "Locked once the session starts."
              : `Attendees answer these when they join, before voting. "${OPT_OUT_ANSWER}" is added to every question.`}
          </p>
        </div>

        {isLocked ? (
          <LockedQuestionList questionDrafts={questionDrafts} />
        ) : (
          <QuestionDraftEditor
            questionDrafts={questionDrafts}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            canSave={canSave}
            onQuestionDraftsChange={onQuestionDraftsChange}
            onSave={onSave}
          />
        )}
      </div>
    </Card>
  );
}

type QuestionDraftEditorProps = Omit<OnboardingQuestionsPanelProps, "isLocked">;

function QuestionDraftEditor({
  questionDrafts,
  isSaving,
  hasUnsavedChanges,
  canSave,
  onQuestionDraftsChange,
  onSave,
}: QuestionDraftEditorProps) {
  const replaceQuestionDraft = (updatedDraft: EventOnboardingQuestionDraft) => {
    onQuestionDraftsChange(
      questionDrafts.map((questionDraft) =>
        questionDraft.draftId === updatedDraft.draftId ? updatedDraft : questionDraft,
      ),
    );
  };

  const removeQuestionDraft = (draftId: string) => {
    onQuestionDraftsChange(questionDrafts.filter((questionDraft) => questionDraft.draftId !== draftId));
  };

  const moveQuestionDraft = (index: number, offset: -1 | 1) => {
    onQuestionDraftsChange(moveEventOnboardingQuestionDraft(questionDrafts, index, offset));
  };

  const addQuestionDraft = () => {
    onQuestionDraftsChange([...questionDrafts, createBlankEventOnboardingQuestionDraft()]);
  };

  const showsIncompleteHint = hasUnsavedChanges && !canSave;

  return (
    <div className="space-y-3">
      {questionDrafts.length === 0 && (
        <p className="text-sm text-muted-foreground">No questions. Attendees go straight to the lobby.</p>
      )}

      {questionDrafts.map((questionDraft, index) => (
        <QuestionDraftRow
          key={questionDraft.draftId}
          questionDraft={questionDraft}
          questionNumber={index + 1}
          isFirst={index === 0}
          isLast={index === questionDrafts.length - 1}
          isDuplicate={isDuplicateQuestionText(questionDraft, questionDrafts)}
          onChange={replaceQuestionDraft}
          onRemove={removeQuestionDraft}
          onMoveUp={() => moveQuestionDraft(index, -1)}
          onMoveDown={() => moveQuestionDraft(index, 1)}
        />
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addQuestionDraft}>
        <Plus />
        Add question
      </Button>

      {showsIncompleteHint && (
        <p className="text-xs invalid-text">
          Every question needs text and at least {EVENT_ONBOARDING_MINIMUM_OPTION_COUNT} option, with no duplicates.
        </p>
      )}

      <Button className="w-full" disabled={!hasUnsavedChanges || !canSave || isSaving} onClick={onSave}>
        {getSaveButtonLabel(isSaving, hasUnsavedChanges)}
      </Button>
    </div>
  );
}

function getSaveButtonLabel(isSaving: boolean, hasUnsavedChanges: boolean): string {
  if (isSaving) return "Saving…";
  return hasUnsavedChanges ? "Save questions" : "Saved";
}

interface QuestionDraftRowProps {
  questionDraft: EventOnboardingQuestionDraft;
  questionNumber: number;
  isFirst: boolean;
  isLast: boolean;
  isDuplicate: boolean;
  onChange: (updatedDraft: EventOnboardingQuestionDraft) => void;
  onRemove: (draftId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function QuestionDraftRow({
  questionDraft,
  questionNumber,
  isFirst,
  isLast,
  isDuplicate,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QuestionDraftRowProps) {
  const pickAnySwitchId = `pick-any-${questionDraft.draftId}`;

  const handlePickAnyChange = (multiSelect: boolean) => {
    onChange({ ...questionDraft, multiSelect });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold text-muted-foreground tabular-nums">Question {questionNumber}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Move question ${questionNumber} up`}
          disabled={isFirst}
          onClick={onMoveUp}
        >
          <ChevronUp />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Move question ${questionNumber} down`}
          disabled={isLast}
          onClick={onMoveDown}
        >
          <ChevronDown />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Switch
            id={pickAnySwitchId}
            checked={questionDraft.multiSelect}
            onCheckedChange={handlePickAnyChange}
          />
          <Label htmlFor={pickAnySwitchId} className="text-sm">
            Pick any
          </Label>
        </div>
      </div>
      <CustomDemographicQuestion
        questionText={questionDraft.text}
        options={questionDraft.options}
        minimumOptionCount={EVENT_ONBOARDING_MINIMUM_OPTION_COUNT}
        isDuplicate={isDuplicate}
        onQuestionTextChange={(text) => onChange({ ...questionDraft, text })}
        onOptionsChange={(options) => onChange({ ...questionDraft, options })}
        onRemove={() => onRemove(questionDraft.draftId)}
      />
    </div>
  );
}

function LockedQuestionList({ questionDrafts }: { questionDrafts: EventOnboardingQuestionDraft[] }) {
  if (questionDrafts.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions for this event.</p>;
  }

  return (
    <ol className="space-y-1.5">
      {questionDrafts.map((questionDraft, index) => (
        <li key={questionDraft.draftId} className="rounded-xl bg-background/70 px-3 py-2">
          <p className="text-sm font-semibold text-foreground">
            {index + 1}. {questionDraft.text}
            {questionDraft.multiSelect && <span className="ml-1.5 text-xs font-normal secondary-text">Pick any</span>}
          </p>
          <p className="text-xs text-muted-foreground">{questionDraft.options.join(" · ")}</p>
        </li>
      ))}
    </ol>
  );
}
