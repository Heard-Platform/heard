// @ts-ignore
import { toast } from "sonner@2.0.3";
import { useEffect, useState } from "react";
import { OnboardingQuestionsPanel } from "./OnboardingQuestionsPanel";
import { api } from "../../utils/api";
import {
  canSaveEventOnboardingQuestions,
  haveEventOnboardingQuestionsChanged,
  toEventOnboardingQuestionDrafts,
  toEventOnboardingQuestionInputs,
} from "../../utils/event-onboarding-questions";
import type { DemographicQuestion, EventOnboardingQuestionDraft, LiveEventStatus } from "../../types";

interface OnboardingQuestionsPanelContainerProps {
  eventId: string;
  status: LiveEventStatus;
}

export function OnboardingQuestionsPanelContainer({ eventId, status }: OnboardingQuestionsPanelContainerProps) {
  const [savedQuestionDrafts, setSavedQuestionDrafts] = useState<EventOnboardingQuestionDraft[] | null>(null);
  const [questionDrafts, setQuestionDrafts] = useState<EventOnboardingQuestionDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  function showSavedQuestions(questions: DemographicQuestion[]) {
    const drafts = toEventOnboardingQuestionDrafts(questions);
    setSavedQuestionDrafts(drafts);
    setQuestionDrafts(drafts);
  }

  useEffect(() => {
    let cancelled = false;
    api.getEventOnboardingQuestions(eventId).then((response) => {
      if (cancelled) return;
      if (response.success && response.data) {
        showSavedQuestions(response.data.questions);
      } else {
        toast.error(response.error || "Couldn't load the onboarding questions");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!savedQuestionDrafts) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const response = await api.updateEventOnboardingQuestions(eventId, toEventOnboardingQuestionInputs(questionDrafts));
    setIsSaving(false);
    if (response.success && response.data) {
      showSavedQuestions(response.data.questions);
      toast.success("Onboarding questions saved");
    } else {
      toast.error(response.error || "Couldn't save the onboarding questions");
    }
  };

  return (
    <OnboardingQuestionsPanel
      questionDrafts={questionDrafts}
      isLocked={status !== "setup"}
      isSaving={isSaving}
      hasUnsavedChanges={haveEventOnboardingQuestionsChanged(questionDrafts, savedQuestionDrafts)}
      canSave={canSaveEventOnboardingQuestions(questionDrafts)}
      onQuestionDraftsChange={setQuestionDrafts}
      onSave={handleSave}
    />
  );
}
