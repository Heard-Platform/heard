import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { X, Plus } from "lucide-react";
import { Label } from "../ui/label";

interface CustomDemographicQuestionProps {
  questionText: string;
  options: string[];
  onQuestionTextChange: (text: string) => void;
  onOptionsChange: (options: string[]) => void;
  onRemove: () => void;
}

export function CustomDemographicQuestion({
  questionText,
  options,
  onQuestionTextChange,
  onOptionsChange,
  onRemove,
}: CustomDemographicQuestionProps) {
  const [newOption, setNewOption] = useState("");

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      onOptionsChange([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    onOptionsChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="border-2 border-purple-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-sm font-medium text-purple-900">
            Question
          </Label>
          <Input
            placeholder="e.g., What neighborhood do you live in?"
            value={questionText}
            onChange={(e) => onQuestionTextChange(e.target.value)}
            className="bg-white border-purple-200 focus:border-purple-400"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="flex-shrink-0 mt-6 h-8 w-8 p-0 hover:bg-red-100 text-red-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-purple-900">
          Answer Options
        </Label>
        
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded text-sm text-slate-700">
                {option}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOption(index)}
                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add an option..."
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddOption();
              }
            }}
            className="flex-1 bg-white border-purple-200 focus:border-purple-400"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            disabled={!newOption.trim() || options.includes(newOption.trim())}
            className="border-purple-300 hover:bg-purple-100"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {options.length === 0 && (
          <p className="text-xs text-purple-600 italic">
            Add at least 2 answer options
          </p>
        )}
      </div>
    </div>
  );
}
