import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { X, Info, ChevronDown } from "lucide-react";
import type { DemographicQuestion } from "../../../types";
import { DataPrivacyModal } from "./DataPrivacyModal";

interface Answer {
  questionId: string;
  answer: string;
}

interface EditAnswersModalProps {
  isOpen: boolean;
  roomTopic: string;
  questions: DemographicQuestion[];
  answers: Answer[];
  onClose: () => void;
  onUpdateAnswer: (questionId: string, answer: string) => void;
  onRemoveAnswer: (questionId: string) => void;
}

const PREFER_NOT_TO_SAY = "prefer_not_to_say";

const standardQuestionsByType: Record<
  Exclude<DemographicQuestion["type"], "custom">,
  { 
    text: string;
    options: Array<{ label: string; value: string }>;
  }
> = {
  gender: {
    text: "What is your gender?",
    options: [
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
      { label: "Non-binary", value: "non_binary" },
      { label: "Prefer not to say", value: PREFER_NOT_TO_SAY },
      { label: "Other", value: "other" },
    ],
  },
  age_range: {
    text: "What is your age range?",
    options: [
      { label: "18-24", value: "18_24" },
      { label: "25-34", value: "25_34" },
      { label: "35-44", value: "35_44" },
      { label: "45-54", value: "45_54" },
      { label: "55-64", value: "55_64" },
      { label: "65+", value: "65_plus" },
      { label: "Prefer not to say", value: PREFER_NOT_TO_SAY },
    ],
  },
  occupation: {
    text: "What is your current employment status?",
    options: [
      { label: "Student", value: "student" },
      { label: "Employed", value: "employed" },
      { label: "Self-employed", value: "self_employed" },
      { label: "Unemployed", value: "unemployed" },
      { label: "Retired", value: "retired" },
      { label: "Other", value: "other" },
      { label: "Prefer not to say", value: PREFER_NOT_TO_SAY },
    ],
  },
};

export function EditAnswersModal({
  isOpen,
  roomTopic,
  questions,
  answers,
  onClose,
  onUpdateAnswer,
  onRemoveAnswer,
}: EditAnswersModalProps) {
  const [localAnswers, setLocalAnswers] = useState<Map<string, string>>(
    new Map(answers.map(a => [a.questionId, a.answer]))
  );
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const handleUpdateAnswer = (questionId: string, answer: string) => {
    setLocalAnswers(new Map(localAnswers.set(questionId, answer)));
    onUpdateAnswer(questionId, answer);
  };

  const handleRemoveAnswer = (questionId: string) => {
    setLocalAnswers(new Map(localAnswers.set(questionId, PREFER_NOT_TO_SAY)));
    onRemoveAnswer(questionId);
  };

  const getQuestionText = (question: DemographicQuestion) => {
    if (question.type !== "custom") {
      return standardQuestionsByType[question.type]?.text || question.text;
    }
    return question.text;
  };

  const getQuestionOptions = (question: DemographicQuestion) => {
    if (question.type !== "custom") {
      return standardQuestionsByType[question.type]?.options || [];
    }
    return question.options?.map(opt => ({ label: opt, value: opt.toLowerCase().replace(/\s+/g, '_') })) || [];
  };

  const getOptionLabel = (question: DemographicQuestion, value: string) => {
    const options = getQuestionOptions(question);
    return options.find(opt => opt.value === value)?.label || value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">
            Your Answers
          </DialogTitle>
          <DialogDescription className="sr-only">
            Manage your answers for this discussion
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm font-medium text-purple-900 mb-1">
              {roomTopic}
            </p>
          </div>

          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 leading-relaxed">
              This information helps the community understand what voices are being represented in the discussion. 
              Your data is only ever displayed in aggregate to protect your privacy, and you can change or remove 
              your answers at any time.
            </p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed text-center">
            <button className="hover:text-foreground transition-colors underline decoration-dotted underline-offset-2" onClick={() => setIsPrivacyModalOpen(true)}>
              Learn more about how we protect your privacy
            </button>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 min-h-0 relative">
          {questions.map((question) => {
            const currentAnswer = localAnswers.get(question.id) || PREFER_NOT_TO_SAY;
            const questionText = getQuestionText(question);
            const options = getQuestionOptions(question);

            return (
              <div
                key={question.id}
                className="flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium mb-2">
                    {questionText}
                  </h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {getOptionLabel(question, currentAnswer)}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56 z-[9999]"
                      align="start"
                    >
                      <DropdownMenuRadioGroup
                        value={currentAnswer}
                        onValueChange={(value: string) =>
                          handleUpdateAnswer(question.id, value)
                        }
                      >
                        {options.map((option) => (
                          <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {currentAnswer !== PREFER_NOT_TO_SAY && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAnswer(question.id)}
                    className="flex-shrink-0 self-start mt-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          <div className="p-6 pt-4">
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
      <DataPrivacyModal 
        variant="learn more"
        isOpen={isPrivacyModalOpen} 
        onClose={() => setIsPrivacyModalOpen(false)} 
      />
    </Dialog>
  );
}