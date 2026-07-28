import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { ChevronDown, ChevronUp, Plus, Users } from "lucide-react";
import { CustomDemographicQuestion } from "./CustomDemographicQuestion";
import { NewCustomDemographicQuestion, type NewDemographicQuestion, type StandardDemographicQuestionType } from "../../types";
import { hasDuplicates } from "../../utils/validation";

interface AdvancedFeaturesProps {
  demographicQuestions: NewDemographicQuestion[];
  onDemographicQuestionsChange: (questions: NewDemographicQuestion[]) => void;
}

const STANDARD_QUESTIONS: Array<{
  type: StandardDemographicQuestionType;
  labelKey: string;
}> = [
  { type: "gender", labelKey: "afQGender" },
  { type: "age_range", labelKey: "afQAgeRange" },
  { type: "occupation", labelKey: "afQEmployment" },
];

export function AdvancedFeatures({
  demographicQuestions,
  onDemographicQuestionsChange,
}: AdvancedFeaturesProps) {
  const { t } = useTranslation("create");
  const [isExpanded, setIsExpanded] = useState(false);

  const isStandardQuestionSelected = (
    type: StandardDemographicQuestionType,
  ) => demographicQuestions.some((q) => q.type === type);

  const handleToggleStandardQuestion = (
    type: StandardDemographicQuestionType,
  ) => {
    if (isStandardQuestionSelected(type)) {
      onDemographicQuestionsChange(
        demographicQuestions.filter((q) => q.type !== type),
      );
    } else {
      onDemographicQuestionsChange([
        ...demographicQuestions,
        { draftId: crypto.randomUUID(), type },
      ]);
    }
  };

  const handleAddCustomQuestion = () => {
    onDemographicQuestionsChange([
      ...demographicQuestions,
      {
        type: "custom",
        text: "",
        options: [],
        draftId: crypto.randomUUID(),
      },
    ]);
  };

  const handleUpdateCustomQuestion = (
    draftId: string,
    text: string,
    options: string[],
  ) => {
    onDemographicQuestionsChange(
      demographicQuestions.map((q) =>
        q.draftId === draftId ? { ...q, text, options } : q,
      ),
    );
  };

  const handleRemoveCustomQuestion = (draftId: string) => {
    onDemographicQuestionsChange(
      demographicQuestions.filter((q) => q.draftId !== draftId)
    );
  };

  const isCustomQuestion = (
    q: NewDemographicQuestion,
  ): q is NewCustomDemographicQuestion => {
    return q.type === "custom";
  };

  const customQuestions = demographicQuestions.filter(isCustomQuestion);

  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50/50">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 heard-between hover:bg-slate-100/50 transition-colors rounded-lg"
      >
        <span className="text-sm text-slate-500 font-medium">
          {t("afTitle")}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-200">
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <Label className="text-sm font-medium text-slate-700">
                {t("afDemographicQuestions")}
              </Label>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t("afDemographicDesc")}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              {t("afStandardQuestions")}
            </Label>
            <div className="space-y-2">
              {STANDARD_QUESTIONS.map(({ type, labelKey }) => (
                <div key={type} className="flex items-center gap-3">
                  <Checkbox
                    id={`question-${type}`}
                    checked={isStandardQuestionSelected(type)}
                    onCheckedChange={() => handleToggleStandardQuestion(type)}
                  />
                  <Label
                    htmlFor={`question-${type}`}
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    {t(labelKey)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="heard-between">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                {t("afCustomQuestions")}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomQuestion}
                className="h-7 text-xs border-purple-300 hover:bg-purple-50 text-purple-700"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t("afAddCustom")}
              </Button>
            </div>

            {customQuestions.length > 0 && (
              <div className="space-y-3">
                {customQuestions.map(({ draftId, text, options }) => (
                  <CustomDemographicQuestion
                    key={draftId}
                    questionText={text}
                    options={options}
                    onQuestionTextChange={(text) =>
                      handleUpdateCustomQuestion(draftId, text, options)
                    }
                    onOptionsChange={(options) =>
                      handleUpdateCustomQuestion(draftId, text, options)
                    }
                    onRemove={() => handleRemoveCustomQuestion(draftId)}
                    isDuplicate={hasDuplicates(
                      text,
                      customQuestions.map((q) => q.text),
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
