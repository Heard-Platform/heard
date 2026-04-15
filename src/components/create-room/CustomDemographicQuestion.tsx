import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { X, Plus } from "lucide-react";
import { Label } from "../ui/label";
import { hasDuplicates } from "../../utils/validation";

interface CustomDemographicQuestionProps {
  questionText: string;
  options: string[];
  isDuplicate: boolean;
  onQuestionTextChange: (text: string) => void;
  onOptionsChange: (options: string[]) => void;
  onRemove: () => void;
}

export function CustomDemographicQuestion({
  questionText,
  options,
  isDuplicate,
  onQuestionTextChange,
  onOptionsChange,
  onRemove,
}: CustomDemographicQuestionProps) {
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    onOptionsChange(updated);
  };

  const handleAddOption = () => {
    onOptionsChange([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    onOptionsChange(options.filter((_, i) => i !== index));
  };

  const nonBlankCount = options.filter((o) => o.trim() !== "").length;
  
  const questionBorderStyling = isDuplicate
    ? "invalid-option"
    : "valid-option";
  
  const optionBorderStyling = (isDuplicate: boolean) => {
    return isDuplicate ? "invalid-option" : "valid-option";
  }

  return (
    <div className="border-2 border-purple-200 rounded-lg p-4 bg-linear-to-r from-purple-50 to-pink-50 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-sm font-medium text-purple-900">
            Question
          </Label>
          <Input
            placeholder="e.g., What neighborhood do you live in?"
            value={questionText}
            onChange={(e) => onQuestionTextChange(e.target.value)}
            className={`bg-white ${questionBorderStyling}`}
          />
          {isDuplicate && (
            <p className="text-xs invalid-text">Duplicate question</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="shrink-0 mt-6 h-8 w-8 p-0 hover:bg-red-100 text-red-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-purple-900">
          Answer Options
        </Label>
        {options.length > 0 && (
          <div className="space-y-2">
            {options.map((option, index) => {
              const isOptionDuplicate = hasDuplicates(
                option,
                options,
              );
              const borderStyling =
                optionBorderStyling(isOptionDuplicate);
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      className={`bg-white ${borderStyling}`}
                    />
                    {isOptionDuplicate && (
                      <p className="text-xs invalid-text">
                        Duplicate option
                      </p>
                    )}
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
              );
            })}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          className="h-7 text-xs border-purple-300 hover:bg-purple-50 text-purple-700"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add option
        </Button>
        {nonBlankCount < 2 && (
          <p className="text-xs text-purple-600 italic">
            Add at least 2 answer options
          </p>
        )}
      </div>
    </div>
  );
}
