import { Button } from "../ui/button";
import { motion } from "motion/react";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { DemographicQuestion, DemographicQuestionType } from "../../types";
import { DataPrivacyModal } from "./my-data/DataPrivacyModal";

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
      "Prefer not to say",
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
  onAnswer: (answer: string | null) => void;
}

export function DemographicsCard({
  question,
  onAnswer,
}: DemographicsCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleSelect = (option: string) => {
    setSelectedAnswer(option);
    onAnswer(option);
  };

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

          <div className="relative h-[150px]">
            <div className="h-full overflow-y-auto scrollbar-hide space-y-2 pb-6">
              {options.map((option, index) => (
                <motion.div
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    onClick={() => handleSelect(option)}
                    variant="outline"
                    className={`w-full h-auto py-2.5 px-4 text-left justify-start transition-all text-sm ${
                      selectedAnswer === option
                        ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                        : "bg-white hover:bg-purple-50 border-purple-200"
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                  </Button>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: options.length * 0.05 }}
                className="text-center py-1"
              >
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted underline-offset-2"
                  onClick={() => onAnswer(null)}
                >
                  I prefer not to answer
                </button>
              </motion.div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />
          </div>

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
