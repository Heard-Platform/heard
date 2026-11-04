// @ts-ignore
import { toast } from "sonner@2.0.3";
import { useEffect, useState } from "react";
import { EventOnboardingQuestionsPanel } from "./EventOnboardingQuestionsPanel";
import { api } from "../../utils/api";
import {
  canSaveEventOnboardingQuestions,
  haveEventOnboardingQuestionsChanged,
  toEventOnboardingQuestionDrafts,
  toEventOnboardingQuestionInputs,
} from "../../utils/event-onboarding-questions";
import type { DemographicQuestion, EventOnboardingQuestionDraft, LiveEventStatus } from "../../types";

interface EventOnboardingQuestionsPanelContainerProps {
  eventId: string;
  status: LiveEventStatus;
}

export function EventOnboardingQuestionsPanelContainer({ eventId, status }: EventOnboardingQuestionsPanelContainerProps) {
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
    <EventOnboardingQuestionsPanel
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
