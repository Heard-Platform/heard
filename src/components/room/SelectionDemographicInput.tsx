import { Button } from "../ui/button";
import { motion } from "motion/react";
import { useState } from "react";
import { PreferNotToAnswerButton } from "./PreferNotToAnswerButton";

interface SelectionDemographicInputProps {
  options: string[];
  onAnswer: (answer: string | null) => void;
}

export function SelectionDemographicInput({
  options,
  onAnswer,
}: SelectionDemographicInputProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelectedAnswer(option);
    onAnswer(option);
  };

  return (
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
          <PreferNotToAnswerButton onClick={() => onAnswer(null)} />
        </motion.div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />
    </div>
  );
}
