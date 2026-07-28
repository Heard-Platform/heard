import { Button } from "../ui/button";
import { motion } from "motion/react";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DemographicQuestion, DemographicQuestionType } from "../../types";
import { DataPrivacyModal } from "./my-data/DataPrivacyModal";

interface StandardOption {
  value: string;
  labelKey?: string;
}

const standardQuestionsByType: Record<
  Exclude<DemographicQuestionType, "custom">,
  { textKey: string; options: StandardOption[] }
> = {
  gender: {
    textKey: "demoGenderQ",
    options: [
      { value: "Male", labelKey: "demoMale" },
      { value: "Female", labelKey: "demoFemale" },
      { value: "Non-binary", labelKey: "demoNonBinary" },
      { value: "Other", labelKey: "demoOther" },
    ],
  },
  age_range: {
    textKey: "demoAgeQ",
    options: [
      { value: "18-24" },
      { value: "25-34" },
      { value: "35-44" },
      { value: "45-54" },
      { value: "55-64" },
      { value: "65+" },
    ],
  },
  occupation: {
    textKey: "demoOccupationQ",
    options: [
      { value: "Student", labelKey: "demoStudent" },
      { value: "Employed", labelKey: "demoEmployed" },
      { value: "Self-employed", labelKey: "demoSelfEmployed" },
      { value: "Unemployed", labelKey: "demoUnemployed" },
      { value: "Retired", labelKey: "demoRetired" },
      { value: "Other", labelKey: "demoOther" },
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
  const { t } = useTranslation("room");
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

  const options: { value: string; label: string }[] = standardQuestion
    ? standardQuestion.options.map((o) => ({
        value: o.value,
        label: o.labelKey ? t(o.labelKey) : o.value,
      }))
    : (question.options ?? []).map((o) => ({ value: o, label: o }));
  const questionText = standardQuestion
    ? t(standardQuestion.textKey)
    : question.text;

  if (options.length === 0 || !questionText) {
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
              {t("demoQuickQuestion")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("demoHelpGroup")}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-base text-foreground mb-3">
            {questionText}
          </h3>

          <div className="relative h-[150px]">
            <div className="h-full overflow-y-auto scrollbar-hide space-y-2 pb-6">
              {options.map(({ value, label }, index) => (
                <motion.div
                  key={value}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    onClick={() => handleSelect(value)}
                    variant="outline"
                    className={`w-full h-auto py-2.5 px-4 text-left justify-start transition-all text-sm ${
                      selectedAnswer === value
                        ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                        : "bg-white hover:bg-purple-50 border-purple-200"
                    }`}
                  >
                    <span className="font-medium">{label}</span>
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
                  {t("demoPreferNot")}
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
                {t("demoWhatFor")}
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
