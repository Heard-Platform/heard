import { Button } from "../ui/button";
import { useState } from "react";
import { PreferNotToAnswerButton } from "./PreferNotToAnswerButton";

interface NumberDemographicInputProps {
  placeholder?: string;
  onAnswer: (answer: string | null) => void;
}

export function NumberDemographicInput({
  placeholder = "Enter a number",
  onAnswer,
}: NumberDemographicInputProps) {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-3">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        placeholder={placeholder}
        className="w-full h-11 px-4 rounded-md border border-purple-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
      <Button
        onClick={() => onAnswer(value)}
        disabled={!value}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      >
        Submit
      </Button>
      <div className="text-center py-1">
        <PreferNotToAnswerButton onClick={() => onAnswer(null)} />
      </div>
    </div>
  );
}
