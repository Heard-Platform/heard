import { useState } from "react";
import { OnboardingQuestionsPanel } from "../components/events/OnboardingQuestionsPanel";
import {
  canSaveEventOnboardingQuestions,
  haveEventOnboardingQuestionsChanged,
  toEventOnboardingQuestionInputs,
} from "../utils/event-onboarding-questions";
import type {
  EventOnboardingQuestionDraft,
  LiveEventStatus,
} from "../types";
import { StoryContainer } from "./StoryContainer";

const STORY_SAVE_DELAY_MS = 800;

const ROLE_DRAFT: EventOnboardingQuestionDraft = {
  draftId: "role",
  text: "Are you a...",
  options: ["Undergrad student", "Grad student", "Faculty", "University staff", "Community member", "Other"],
  multiSelect: false,
};

const IDENTITY_DRAFT: EventOnboardingQuestionDraft = {
  draftId: "identity",
  text: "How do you identify?",
  options: ["Black", "Multiracial", "White", "Latinx", "Arab", "Jewish", "Muslim", "Other"],
  multiSelect: true,
};

const INCOMPLETE_DRAFT: EventOnboardingQuestionDraft = {
  draftId: "incomplete",
  text: "",
  options: ["", ""],
  multiSelect: false,
};

interface QuestionsPanelDemoProps {
  initialSavedDrafts: EventOnboardingQuestionDraft[];
  initialDrafts: EventOnboardingQuestionDraft[];
  status: LiveEventStatus;
  hasAnswers: boolean;
}

function QuestionsPanelDemo({
  initialSavedDrafts,
  initialDrafts,
  status,
  hasAnswers,
}: QuestionsPanelDemoProps) {
  const [savedDrafts, setSavedDrafts] = useState(initialSavedDrafts);
  const [questionDrafts, setQuestionDrafts] = useState(initialDrafts);
  const [isSaving, setIsSaving] = useState(false);


  const handleSave = () => {
    console.log("[Story] save", toEventOnboardingQuestionInputs(questionDrafts));
    setIsSaving(true);
    setTimeout(() => {
      setSavedDrafts(questionDrafts);
      setIsSaving(false);
    }, STORY_SAVE_DELAY_MS);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <OnboardingQuestionsPanel
        questionDrafts={questionDrafts}
        status={status}
        hasAnswers={hasAnswers}
        isSaving={isSaving}
        hasUnsavedChanges={haveEventOnboardingQuestionsChanged(questionDrafts, savedDrafts)}
        canSave={canSaveEventOnboardingQuestions(questionDrafts)}
        onQuestionDraftsChange={setQuestionDrafts}
        onSave={handleSave}
      />
    </div>
  );
}

export function OnboardingQuestionsPanelStory() {
  return (
    <StoryContainer
      title="Onboarding Questions Panel"
      description="Moderator-only panel under the live session panel on the event page. Moderators add the demographic questions attendees answer when they join. Questions are custom only, each with a Pick any switch and up/down order. Prefer not to say is added to every question automatically, so one real option is enough. Saving replaces the event's whole list. Editing locks once the session starts."
      variants={[
        {
          id: "saved",
          label: "Saved",
          description:
            "Two saved questions, one single choice and one pick any. Checks the layout, that reordering or flipping Pick any turns the button into Save questions, and that saving returns it to Saved.",
          children: (
            <QuestionsPanelDemo
              key="saved"
              initialSavedDrafts={[ROLE_DRAFT, IDENTITY_DRAFT]}
              initialDrafts={[ROLE_DRAFT, IDENTITY_DRAFT]}
              status="setup" hasAnswers={false}
            />
          ),
        },
        {
          id: "empty",
          label: "No questions",
          description:
            "An event with no questions yet. Checks the empty message and that Add question starts a blank question with two empty options.",
          children: <QuestionsPanelDemo key="empty" initialSavedDrafts={[]} initialDrafts={[]} status="setup" hasAnswers={false} />,
        },
        {
          id: "incomplete",
          label: "Incomplete",
          description:
            "An unsaved blank question. Checks that Save is disabled with the hint showing until the question has text and at least one option, and that duplicate questions or options are flagged.",
          children: (
            <QuestionsPanelDemo
              key="incomplete"
              initialSavedDrafts={[ROLE_DRAFT]}
              initialDrafts={[ROLE_DRAFT, INCOMPLETE_DRAFT]}
              status="setup" hasAnswers={false}
            />
          ),
        },
        {
          id: "locked",
          label: "Locked",
          description:
            "The session has started. Checks that the questions show read only, with their options and a Pick any tag, and nothing can be edited.",
          children: (
            <QuestionsPanelDemo
              key="locked"
              initialSavedDrafts={[ROLE_DRAFT, IDENTITY_DRAFT]}
              initialDrafts={[ROLE_DRAFT, IDENTITY_DRAFT]}
              status="live" hasAnswers={false}
            />
          ),
        },
        {
          id: "locked-answered",
          label: "Locked, answered",
          description:
            "Still in setup, but someone has answered (say, from a flyer). Checks the read-only list and the message saying why it's locked.",
          children: (
            <QuestionsPanelDemo
              key="locked-answered"
              initialSavedDrafts={[ROLE_DRAFT, IDENTITY_DRAFT]}
              initialDrafts={[ROLE_DRAFT, IDENTITY_DRAFT]}
              status="setup" hasAnswers
            />
          ),
        },
        {
          id: "locked-empty",
          label: "Locked, no questions",
          description: "The session started with no questions. Checks the locked empty message.",
          children: <QuestionsPanelDemo key="locked-empty" initialSavedDrafts={[]} initialDrafts={[]} status="live" hasAnswers={false} />,
        },
      ]}
    />
  );
}
