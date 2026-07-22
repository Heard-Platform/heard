import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { DemographicQuestion, DemographicQuestionType } from "../../types";
import { DataPrivacyModal } from "./my-data/DataPrivacyModal";
import { SelectionDemographicInput } from "./SelectionDemographicInput";
import { NumberDemographicInput } from "./NumberDemographicInput";

const standardQuestionsByType: Record<
  Exclude<DemographicQuestionType, "custom">,
  Pick<DemographicQuestion, "text" | "options"> & { inputType?: "number" }
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
  zip_code: {
    text: "What zipcode do you live in?",
    inputType: "number",
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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const standardQuestion =
    question.type !== "custom"
      ? standardQuestionsByType[question.type]
      : null;

  const inputType = standardQuestion?.inputType;
  const options = standardQuestion
    ? standardQuestion.options
    : question.options;
  const questionText = standardQuestion
    ? standardQuestion.text
    : question.text;

  if (!questionText || (inputType !== "number" && (!options || options.length === 0))) {
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

          {inputType === "number" ? (
            <NumberDemographicInput onAnswer={onAnswer} />
          ) : (
            <SelectionDemographicInput
              options={options ?? []}
              onAnswer={onAnswer}
            />
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
