import { useState } from "react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { ChevronDown, ChevronUp, Plus, Users } from "lucide-react";
import { CustomDemographicQuestion } from "./CustomDemographicQuestion";
import type { NewDemographicQuestion } from "../../types";

interface AdvancedFeaturesProps {
  demographicQuestions: NewDemographicQuestion[];
  onDemographicQuestionsChange: (questions: NewDemographicQuestion[]) => void;
}

const STANDARD_QUESTIONS: Array<{
  type: "gender" | "age_range" | "occupation";
  label: string;
}> = [
  { type: "gender", label: "Gender" },
  { type: "age_range", label: "Age Range" },
  { type: "occupation", label: "Employment Status" },
];

export function AdvancedFeatures({
  demographicQuestions,
  onDemographicQuestionsChange,
}: AdvancedFeaturesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isStandardQuestionSelected = (type: "gender" | "age_range" | "occupation") => {
    return demographicQuestions.some((q) => q.type === type);
  };

  const handleToggleStandardQuestion = (type: "gender" | "age_range" | "occupation") => {
    if (isStandardQuestionSelected(type)) {
      onDemographicQuestionsChange(
        demographicQuestions.filter((q) => q.type !== type)
      );
    } else {
      onDemographicQuestionsChange([
        ...demographicQuestions,
        {
          type,
        },
      ]);
    }
  };

  const handleAddCustomQuestion = () => {
    const newQuestion: NewDemographicQuestion = {
      type: "custom",
      text: "",
      options: [],
    };
    onDemographicQuestionsChange([...demographicQuestions, newQuestion]);
  };

  const handleUpdateCustomQuestion = (idx: number, text: string, options: string[]) => {
    onDemographicQuestionsChange(
      demographicQuestions.map((q, i) =>
        i === idx ? { ...q, text, options } : q
      )
    );
  };

  const handleRemoveCustomQuestion = (idx: number) => {
    onDemographicQuestionsChange(
      demographicQuestions.filter((_, i) => i !== idx)
    );
  };

  const customQuestions = demographicQuestions.filter((q) => q.type === "custom");

  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50/50">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 heard-between hover:bg-slate-100/50 transition-colors rounded-lg"
      >
        <span className="text-sm text-slate-500 font-medium">
          Advanced Features
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
                Demographic Questions
              </Label>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add questions to understand who's participating in this conversation. These questions will be interspersed throughout the conversation deck and are optional for participants to answer.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Standard Questions
            </Label>
            <div className="space-y-2">
              {STANDARD_QUESTIONS.map(({ type, label }) => (
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
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="heard-between">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Custom Questions
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomQuestion}
                className="h-7 text-xs border-purple-300 hover:bg-purple-50 text-purple-700"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Custom
              </Button>
            </div>

            {customQuestions.length > 0 && (
              <div className="space-y-3">
                {customQuestions.map((question, idx) => (
                  <CustomDemographicQuestion
                    key={idx}
                    questionText={question.text || ""}
                    options={question.options || []}
                    onQuestionTextChange={(text) =>
                      handleUpdateCustomQuestion(idx, text, question.options || [])
                    }
                    onOptionsChange={(options) =>
                      handleUpdateCustomQuestion(idx, question.text || "", options)
                    }
                    onRemove={() => handleRemoveCustomQuestion(idx)}
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