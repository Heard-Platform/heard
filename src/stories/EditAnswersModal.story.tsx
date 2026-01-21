import { useState } from "react";
import { EditAnswersModal } from "../components/room/my-data/EditAnswersModal";
import { Button } from "../components/ui/button";
import type { DemographicQuestion } from "../types";

interface Answer {
  questionId: string;
  answer: string;
}

const mockQuestions: DemographicQuestion[] = [
  {
    id: "1",
    type: "gender",
  },
  {
    id: "2",
    type: "age_range",
  },
  {
    id: "3",
    type: "occupation",
  },
];

const initialAnswers: Answer[] = [
  {
    questionId: "1",
    answer: "non_binary",
  },
  {
    questionId: "2",
    answer: "25_34",
  },
  {
    questionId: "3",
    answer: "prefer_not_to_say",
  },
];

export function EditAnswersModalStory() {
  const [isOpen, setIsOpen] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>(initialAnswers);

  const handleUpdateAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => 
          a.questionId === questionId ? { ...a, answer } : a
        );
      } else {
        return [...prev, { questionId, answer }];
      }
    });
  };

  const handleRemoveAnswer = (questionId: string) => {
    handleUpdateAnswer(questionId, "prefer_not_to_say");
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Answers Modal</h1>
          <p className="text-muted-foreground">
            A modal for users to view and modify their answers for a specific discussion
          </p>
        </div>

        <Button onClick={() => setIsOpen(true)} size="lg">
          Open Answer Editor
        </Button>

        <EditAnswersModal
          isOpen={isOpen}
          questions={mockQuestions}
          answers={answers}
          onClose={() => setIsOpen(false)}
          onUpdateAnswer={handleUpdateAnswer}
          onRemoveAnswer={handleRemoveAnswer}
        />
      </div>
    </div>
  );
}