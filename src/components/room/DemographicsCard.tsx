import { Button } from "../ui/button";
import { motion } from "motion/react";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { DemographicQuestion, DemographicQuestionType } from "../../types";
import { DataPrivacyModal } from "./my-data/DataPrivacyModal";
import { useScrollOverflow } from "../../hooks/useScrollOverflow";
import { toggleMultiSelectAnswer } from "../../utils/demographic-questions";

const standardQuestionsByType: Record<
  Exclude<DemographicQuestionType, "custom">,
  Pick<DemographicQuestion, "text" | "options">
> = {
  gender: {
    text: "What is your gender?",
    options: [
      "Male",
      "Female",
      "Non-binary",
      "Other",
    ],
  },
  age_range: {
    text: "What is your age range?",
    options: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
  },
  occupation: {
    text: "What is your current employment status?",
    options: [
      "Student",
      "Employed",
      "Self-employed",
      "Unemployed",
      "Retired",
      "Other",
    ],
  },
};

interface DemographicsCardProps {
  question: DemographicQuestion;
  onAnswer: (answers: string[]) => void;
}

export function DemographicsCard({
  question,
  onAnswer,
}: DemographicsCardProps) {
  const [pickedAnswers, setPickedAnswers] = useState<string[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { ref: scrollRef, hasContentBelow } =
    useScrollOverflow<HTMLDivElement>();

  const handlePickOption = (option: string) => {
    if (question.multiSelect) {
      setPickedAnswers(
        toggleMultiSelectAnswer(pickedAnswers, option),
      );
      return;
    }
    setPickedAnswers([option]);
    onAnswer([option]);
  };

  const handleContinue = () => onAnswer(pickedAnswers);

  const handleDecline = () => onAnswer([]);

  const standardQuestion =
    question.type !== "custom"
      ? standardQuestionsByType[question.type]
      : null;

  const options = standardQuestion
    ? standardQuestion.options
    : question.options;
  const questionText = standardQuestion
    ? standardQuestion.text
    : question.text;

  if (!options || options.length === 0 || !questionText) {
    throw new Error(
      "DemographicsCard requires a question text and options.",
    );
  }

  return (
    <div className="w-full rounded-xl bg-gradient-to-br from-purple-100 via-white to-blue-100 border-2 border-purple-300 shadow-xl overflow-hidden">
      <div className="h-full flex flex-col p-5">
        <div className="mb-4 flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">
              Quick Question
            </p>
            <p className="text-xs text-muted-foreground">
              Help the group know who's here
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-base text-foreground mb-3">
            {questionText}
          </h3>
          {question.multiSelect && (
            <p className="-mt-2 mb-3 text-xs secondary-text">
              Pick any that fit.
            </p>
          )}

          <div className="relative h-[150px]">
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto scrollbar-desktop-only pr-1"
            >
              <div className="flex flex-wrap gap-2">
                {options.map((option, index) => (
                  <motion.div
                    key={option}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="max-w-full"
                  >
                    <Button
                      onClick={() => handlePickOption(option)}
                      variant="outline"
                      aria-pressed={pickedAnswers.includes(option)}
                      className={`max-w-full h-auto py-2.5 px-4 text-left whitespace-normal transition-all text-sm ${
                        pickedAnswers.includes(option)
                          ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                          : "bg-white hover:bg-purple-50 border-purple-200"
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: options.length * 0.05 }}
                className="text-center py-1 mt-2"
              >
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted underline-offset-2"
                  onClick={handleDecline}
                >
                  I prefer not to answer
                </button>
              </motion.div>
            </div>
            <div
              className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none transition-opacity duration-200 ${
                hasContentBelow ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>

          {question.multiSelect && (
            <Button
              className="mt-3 w-full"
              disabled={pickedAnswers.length === 0}
              onClick={handleContinue}
            >
              Continue
            </Button>
          )}

          <div className="mt-2">
            <p className="pt-1 text-xs text-muted-foreground text-center">
              <button
                className="hover:text-foreground transition-colors underline decoration-dotted underline-offset-2"
                onClick={() => setShowPrivacyModal(true)}
              >
                What is this for?
              </button>
            </p>
          </div>
        </div>
      </div>

      <DataPrivacyModal
        variant="learn more"
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
}
