import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { DemographicQuestion } from "../types";
import { EventLobby } from "../components/events/attendee/EventLobby";
import {
  EventOnboarding,
  type OnboardingWelcomeVariant,
} from "../components/events/attendee/EventOnboarding";
import { EventOnboardingQuestion } from "../components/events/attendee/EventOnboardingQuestion";
import { Button } from "../components/ui/button";
import { OPT_OUT_ANSWER, toggleMultiSelectAnswer } from "../utils/demographic-questions";
import { StoryContainer } from "./StoryContainer";
import { PhoneFrame } from "./PhoneFrame";

const STORY_EVENT_ID = 1;

const customQuestion = (id: string, text: string, options: string[], multiSelect = false): DemographicQuestion => ({
  id,
  roomId: null,
  eventId: STORY_EVENT_ID,
  type: "custom",
  text,
  options,
  multiSelect,
  position: null,
});

const ROLE_QUESTION = customQuestion("role", "Are you a...", [
  "Undergrad student",
  "Grad student",
  "Faculty",
  "University staff",
  "Community member",
  "Other",
]);

const FIELD_QUESTION = customQuestion("field", "What is your field of study or work?", [
  "Humanities",
  "Social sciences",
  "STEM",
  "Business",
  "Law or policy",
  "Health or medicine",
  "Other",
]);

const POLITICAL_ORIENTATION_QUESTION = customQuestion("political", "How would you describe your political orientation?", [
  "Conservative",
  "Moderate",
  "Liberal",
  "Progressive",
  "Libertarian",
  "Independent",
  "Other",
]);

const GENDER_QUESTION = customQuestion("gender", "What is your gender?", ["Female", "Male", "Nonbinary"]);

const IDENTITY_QUESTION = customQuestion(
  "identity",
  "How do you identify?",
  [
    "Black",
    "Multiracial",
    "White",
    "Latinx",
    "Arab",
    "Muslim",
    "Jewish",
    "Christian",
    "Buddhist",
    "Hindu",
    "Immigrant",
    "Asian Pacific Islander",
    "Indigenous",
    "Other",
  ],
  true,
);

export const CAMPUS_EVENT_QUESTIONS = [
  ROLE_QUESTION,
  FIELD_QUESTION,
  POLITICAL_ORIENTATION_QUESTION,
  GENDER_QUESTION,
  IDENTITY_QUESTION,
];

const TWO_QUESTIONS = [ROLE_QUESTION, IDENTITY_QUESTION];

function OnboardingDemo({
  questions,
  welcomeVariant,
  answeredQuestionIds,
}: {
  questions: DemographicQuestion[];
  welcomeVariant: OnboardingWelcomeVariant;
  answeredQuestionIds: string[];
}) {
  const [runKey, setRunKey] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleReplay = () => {
    setIsFinished(false);
    setRunKey((key) => key + 1);
  };

  const handleAnswer = (questionId: string, answers: string[]) => {
    console.log("[Story] answer", questionId, answers.length > 0 ? answers : "skipped");
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="gap-2" onClick={handleReplay}>
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>
      <PhoneFrame>
        {isFinished ? (
          <EventLobby moment="starting" peopleHere={214} />
        ) : (
          <EventOnboarding
            key={runKey}
            questions={questions}
            welcomeVariant={welcomeVariant}
            answeredQuestionIds={answeredQuestionIds}
            onAnswer={handleAnswer}
            onFinish={() => setIsFinished(true)}
          />
        )}
      </PhoneFrame>
    </div>
  );
}

function QuestionDemo({
  question,
  questionNumber,
  initialPickedAnswers,
}: {
  question: DemographicQuestion;
  questionNumber: number;
  initialPickedAnswers: string[];
}) {
  const [pickedAnswers, setPickedAnswers] = useState(initialPickedAnswers);

  const handlePickOption = (option: string) => {
    setPickedAnswers(question.multiSelect ? toggleMultiSelectAnswer(pickedAnswers, option) : [option]);
  };

  return (
    <PhoneFrame>
      <EventOnboardingQuestion
        question={question}
        questionNumber={questionNumber}
        questionCount={CAMPUS_EVENT_QUESTIONS.length}
        pickedAnswers={pickedAnswers}
        onPickOption={handlePickOption}
        onContinue={() => console.log("[Story] continue", pickedAnswers)}
        onBack={() => console.log("[Story] back")}
      />
    </PhoneFrame>
  );
}

export function EventOnboardingStory() {
  return (
    <StoryContainer
      title="Event Onboarding"
      description="Demographic questions an attendee answers when joining an event, before the lobby. The welcome reads as a task, with the question count and progress segments taken from the event's questions. One question per screen. One-choice questions move on with a tap; pick-any questions have Continue, which reads Skip until something is picked. Every question ends with Prefer not to say, which clears other picks on a pick-any question. A reload resumes at the first unanswered question, skipping the welcome. Answers are report only."
      variants={[
        {
          id: "tap-through",
          label: "Tap through",
          description:
            "The whole flow with all 5 questions: welcome, each question, then the lobby. Checks that single choice moves on after a tap, pick any waits for Continue or Skip, Back works on every screen, and finishing lands on \"You're in.\" Answers log to the console.",
          children: (
            <OnboardingDemo
              key="tap-through"
              questions={CAMPUS_EVENT_QUESTIONS}
              welcomeVariant="joining-event"
              answeredQuestionIds={[]}
            />
          ),
        },
        {
          id: "welcome-two",
          label: "Welcome, 2 questions",
          description:
            "The welcome with a different number of questions. Checks that the header reads \"Answer 2 quick questions\" and the progress bar has 2 segments, both taken from the event's question list, not hardcoded.",
          children: (
            <OnboardingDemo
              key="welcome-two"
              questions={TWO_QUESTIONS}
              welcomeVariant="joining-event"
              answeredQuestionIds={[]}
            />
          ),
        },
        {
          id: "resume",
          label: "Some answers provided",
          description:
            "Someone who reloads after answering the first 2 questions. Checks that it skips the welcome and opens at question 3 of 5, and that Back still reaches the earlier questions.",
          children: (
            <OnboardingDemo
              key="resume"
              questions={CAMPUS_EVENT_QUESTIONS}
              welcomeVariant="joining-event"
              answeredQuestionIds={[
                ROLE_QUESTION.id,
                FIELD_QUESTION.id,
              ]}
            />
          ),
        },
        {
          id: "keep-voting",
          label: "Keep voting welcome",
          description:
            "What a flyer scanner sees after tapping Keep voting on the event invite card. Checks that the welcome reads \"Thanks for voting!\" and \"Before you keep voting, 5 quick questions\", with the same progress segments, privacy line and questions as the event.",
          children: (
            <OnboardingDemo
              key="keep-voting"
              questions={CAMPUS_EVENT_QUESTIONS}
              welcomeVariant="keep-voting"
              answeredQuestionIds={[]}
            />
          ),
        },
        {
          id: "one-choice",
          label: "One choice",
          description:
            "A single-choice question with nothing picked yet. Checks the full-width option rows, the progress header (1 of 5), and that Prefer not to say is added as the last option.",
          children: (
            <QuestionDemo
              key="one-choice"
              question={ROLE_QUESTION}
              questionNumber={1}
              initialPickedAnswers={[]}
            />
          ),
        },
        {
          id: "one-choice-picked",
          label: "One choice, picked",
          description:
            "A single-choice question with an answer picked. Checks the selected style (dark fill) and that tapping another option moves the selection.",
          children: (
            <QuestionDemo
              key="one-choice-picked"
              question={GENDER_QUESTION}
              questionNumber={4}
              initialPickedAnswers={["Female"]}
            />
          ),
        },
        {
          id: "long-list",
          label: "Long list scrolls",
          description:
            "A question with more options than fit on a short phone. Checks that only the option list scrolls (the header and footnote stay put) and that the bottom fade shows while there is more below.",
          children: (
            <QuestionDemo
              key="long-list"
              question={POLITICAL_ORIENTATION_QUESTION}
              questionNumber={3}
              initialPickedAnswers={[]}
            />
          ),
        },
        {
          id: "pick-any-skip",
          label: "Pick any, Skip",
          description:
            "A pick-any question with nothing picked. Checks the \"Pick any that fit.\" hint, the pill-shaped options, and that the button reads Skip until something is picked.",
          children: (
            <QuestionDemo
              key="pick-any-skip"
              question={IDENTITY_QUESTION}
              questionNumber={5}
              initialPickedAnswers={[]}
            />
          ),
        },
        {
          id: "pick-any-two",
          label: "Pick any, two picked",
          description:
            "A pick-any question with two options picked. Checks that several picks can be on at once, that tapping one again unpicks it, and that the button reads Continue.",
          children: (
            <QuestionDemo
              key="pick-any-two"
              question={IDENTITY_QUESTION}
              questionNumber={5}
              initialPickedAnswers={["Multiracial", "Immigrant"]}
            />
          ),
        },
        {
          id: "pick-any-prefer-not",
          label: "Pick any, Prefer not to say",
          description:
            "A pick-any question with Prefer not to say picked. Checks that Prefer not to say clears any other picks, and that picking anything else clears Prefer not to say.",
          children: (
            <QuestionDemo
              key="pick-any-prefer-not"
              question={IDENTITY_QUESTION}
              questionNumber={5}
              initialPickedAnswers={[OPT_OUT_ANSWER]}
            />
          ),
        },
      ]}
    />
  );
}
