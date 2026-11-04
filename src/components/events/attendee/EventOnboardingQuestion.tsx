import type { ReactNode } from "react";
import { ChevronLeft, Lock } from "lucide-react";
import type { DemographicQuestion } from "../../../types";
import { useScrollOverflow } from "../../../hooks/useScrollOverflow";
import { getOptionsPlusOptOut } from "../../../utils/demographic-questions";
import { Button } from "../../ui/button";
import { cn } from "../../ui/utils";
import { AttendeeFrame } from "./AttendeeFrame";
import { OnboardingProgressSegments } from "./OnboardingProgressSegments";

interface EventOnboardingQuestionProps {
  question: DemographicQuestion;
  questionNumber: number;
  questionCount: number;
  pickedAnswers: string[];
  onPickOption: (option: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function EventOnboardingQuestion({
  question,
  questionNumber,
  questionCount,
  pickedAnswers,
  onPickOption,
  onContinue,
  onBack,
}: EventOnboardingQuestionProps) {
  const options = getOptionsPlusOptOut(question);

  return (
    <AttendeeFrame
      header={
        <QuestionProgressHeader
          questionNumber={questionNumber}
          questionCount={questionCount}
          onBack={onBack}
        />
      }
    >
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3.5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
            {question.text}
          </h1>
          {question.multiSelect && (
            <p className="text-[15px] secondary-text-strong">Pick any that fit.</p>
          )}
        </div>

        <OptionList isMultiSelect={question.multiSelect}>
          {options.map((option) => (
            <OptionButton
              key={option}
              option={option}
              isPicked={pickedAnswers.includes(option)}
              shape={question.multiSelect ? "chip" : "row"}
              onPick={onPickOption}
            />
          ))}
        </OptionList>

        {question.multiSelect && (
          <Button size="lg" className="h-13 w-full shrink-0 rounded-xl text-[17px] font-bold" onClick={onContinue}>
            {pickedAnswers.length > 0 ? "Continue" : "Skip"}
          </Button>
        )}

        <p className="flex shrink-0 items-center justify-center gap-1.5 text-[13px] secondary-text-strong">
          <Lock className="size-3.5" aria-hidden="true" />
          Anonymous. Answers only shown in groups.
        </p>
      </div>
    </AttendeeFrame>
  );
}

interface QuestionProgressHeaderProps {
  questionNumber: number;
  questionCount: number;
  onBack: () => void;
}

function QuestionProgressHeader({ questionNumber, questionCount, onBack }: QuestionProgressHeaderProps) {
  return (
    <div className="flex w-full items-center gap-2.5">
      <Button variant="ghost" size="icon" className="-ml-2.5 size-11" aria-label="Back" onClick={onBack}>
        <ChevronLeft className="size-[22px]" />
      </Button>
      <OnboardingProgressSegments
        className="flex-1"
        segmentCount={questionCount}
        filledSegmentCount={questionNumber}
        size="small"
      />
      <span className="text-[13px] font-semibold tabular-nums secondary-text-strong">
        {questionNumber} of {questionCount}
      </span>
    </div>
  );
}

interface OptionListProps {
  isMultiSelect: boolean;
  children: ReactNode;
}

function OptionList({ isMultiSelect, children }: OptionListProps) {
  const { ref: scrollRef, hasContentBelow } = useScrollOverflow<HTMLDivElement>();

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        className={cn(
          "h-full overflow-y-auto scrollbar-hide",
          isMultiSelect ? "flex flex-wrap content-start gap-2" : "flex flex-col gap-2",
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-9 feed-bottom-fade transition-opacity duration-200",
          hasContentBelow ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

interface OptionButtonProps {
  option: string;
  isPicked: boolean;
  shape: "row" | "chip";
  onPick: (option: string) => void;
}

function OptionButton({ option, isPicked, shape, onPick }: OptionButtonProps) {
  return (
    <Button
      variant="outline"
      aria-pressed={isPicked}
      className={cn(
        "h-auto shrink-0 whitespace-normal border-[1.5px] font-semibold",
        shape === "row"
          ? "min-h-12 w-full justify-start rounded-xl px-4 py-3 text-left text-base"
          : "min-h-11 rounded-full px-4 py-2 text-[15px]",
        isPicked && "selected-option",
      )}
      onClick={() => onPick(option)}
    >
      {option}
    </Button>
  );
}
