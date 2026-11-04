import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import type { DemographicQuestion } from "../../../types";
import {
  findFirstUnansweredQuestionIndex,
  toggleMultiSelectAnswer,
} from "../../../utils/demographic-questions";
import { pluralizeQuestion } from "../../../utils/text";
import { Button } from "../../ui/button";
import { AttendeeFrame } from "./AttendeeFrame";
import { EventOnboardingQuestion } from "./EventOnboardingQuestion";
import { OnboardingProgressSegments } from "./OnboardingProgressSegments";

const AUTO_ADVANCE_DELAY_MS = 250;

type OnboardingScreen =
  | { type: "welcome" }
  | { type: "question"; questionIndex: number };

interface EventOnboardingProps {
  questions: DemographicQuestion[];
  answeredQuestionIds: string[];
  onAnswer: (questionId: string, answers: string[]) => void;
  onFinish: () => void;
}

export function EventOnboarding({
  questions,
  answeredQuestionIds,
  onAnswer,
  onFinish,
}: EventOnboardingProps) {
  const [screen, setScreen] = useState<OnboardingScreen>(() =>
    calcCurrentScreen(questions, answeredQuestionIds),
  );
  const [pickedAnswersByQuestionId, setPickedAnswersByQuestionId] = useState<Record<string, string[]>>({});
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => cancelAutoAdvance, []);

  function calcCurrentScreen(
    questions: DemographicQuestion[],
    answeredQuestionIds: string[],
  ): OnboardingScreen {
    const resumeQuestionIndex = findFirstUnansweredQuestionIndex(questions, answeredQuestionIds);
    const isStillAnswering = resumeQuestionIndex > 0 && resumeQuestionIndex < questions.length;
    return isStillAnswering
      ? { type: "question", questionIndex: resumeQuestionIndex }
      : { type: "welcome" };
  }

  function cancelAutoAdvance() {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = null;
  }

  function moveToNextQuestion(fromQuestionIndex: number) {
    const nextQuestionIndex = fromQuestionIndex + 1;
    if (nextQuestionIndex >= questions.length) {
      onFinish();
      return;
    }
    setScreen({ type: "question", questionIndex: nextQuestionIndex });
  }

  function savePickedAnswers(questionId: string, pickedAnswers: string[]) {
    setPickedAnswersByQuestionId((previous) => ({ ...previous, [questionId]: pickedAnswers }));
  }

  if (screen.type === "welcome") {
    const handleStart = () => setScreen({ type: "question", questionIndex: 0 });
    return <OnboardingWelcome questionCount={questions.length} onStart={handleStart} />;
  }

  const { questionIndex } = screen;
  const question = questions[questionIndex];
  const pickedAnswers = pickedAnswersByQuestionId[question.id] ?? [];

  const handlePickOption = (option: string) => {
    if (question.multiSelect) {
      savePickedAnswers(question.id, toggleMultiSelectAnswer(pickedAnswers, option));
      return;
    }
    savePickedAnswers(question.id, [option]);
    onAnswer(question.id, [option]);
    cancelAutoAdvance();
    autoAdvanceTimer.current = setTimeout(
      () => moveToNextQuestion(questionIndex),
      AUTO_ADVANCE_DELAY_MS,
    );
  };

  const handleContinue = () => {
    onAnswer(question.id, pickedAnswers);
    moveToNextQuestion(questionIndex);
  };

  const handleBack = () => {
    cancelAutoAdvance();
    setScreen(
      questionIndex === 0
        ? { type: "welcome" }
        : { type: "question", questionIndex: questionIndex - 1 },
    );
  };

  return (
    <EventOnboardingQuestion
      key={question.id}
      question={question}
      questionNumber={questionIndex + 1}
      questionCount={questions.length}
      pickedAnswers={pickedAnswers}
      onPickOption={handlePickOption}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
}

interface OnboardingWelcomeProps {
  questionCount: number;
  onStart: () => void;
}

function OnboardingWelcome({ questionCount, onStart }: OnboardingWelcomeProps) {
  return (
    <AttendeeFrame>
      <div className="flex flex-1 flex-col justify-center gap-6 px-1">
        <div className="space-y-2.5">
          <p className="text-base font-bold secondary-text-strong">Welcome!</p>
          <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight text-foreground">
            Answer {questionCount} quick {pluralizeQuestion(questionCount)} to get started
          </h1>
          <p className="text-base leading-snug secondary-text-strong">Then we'll get things going!</p>
        </div>

        <OnboardingProgressSegments segmentCount={questionCount} filledSegmentCount={0} size="large" />

        <p className="flex items-start gap-2.5 text-[15px] leading-snug secondary-text-strong">
          <Lock className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
          <span>
            <span className="font-bold text-foreground">Totally anonymous.</span> We only show results by group, so
            no one can see your individual votes or responses.
          </span>
        </p>
      </div>

      <Button size="lg" className="h-14 w-full rounded-xl text-lg font-bold" onClick={onStart}>
        Start questions
        <ArrowRight className="size-5" />
      </Button>
    </AttendeeFrame>
  );
}
