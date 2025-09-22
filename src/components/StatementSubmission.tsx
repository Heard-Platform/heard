import { useState } from "react";
import { motion } from "motion/react";
import { Send, Lightbulb, Zap, Target, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner@2.0.3";

type Phase =
  | "lobby"
  | "initial"
  | "bridge"
  | "crux"
  | "plurality"
  | "results";

interface StatementSubmissionProps {
  onSubmit: (
    statement: string,
    type?: "bridge" | "crux" | "plurality",
  ) => Promise<void>;
  currentRound: Phase;
  isActive: boolean;
  placeholder?: string;
}

export function StatementSubmission({
  onSubmit,
  currentRound,
  isActive,
  placeholder,
}: StatementSubmissionProps) {
  const [statement, setStatement] = useState("");
  const [selectedType, setSelectedType] = useState<
    "bridge" | "crux" | "plurality" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateStatement = (text: string): string | null => {
    const trimmed = text.trim();
    if (!trimmed) {
      return "Please enter a statement";
    }
    if (trimmed.length < 5) {
      return "Statement must be at least 5 characters";
    }
    if (trimmed.length > 500) {
      return "Statement must be under 500 characters";
    }
    return null;
  };

  const handleSubmit = async () => {
    const trimmed = statement.trim();
    const error = validateStatement(statement);
    
    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      await onSubmit(trimmed, selectedType || undefined);
      setStatement("");
      setSelectedType(null);
      toast.success("Statement submitted! 🎉");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to submit statement";
      setValidationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear validation error when statement changes
  const handleStatementChange = (text: string) => {
    setStatement(text);
    if (validationError) {
      setValidationError(null);
    }
  };

  const getRoundInfo = () => {
    if (currentRound === "bridge") {
      return {
        title: "Find Bridges 🌉",
        description:
          "Submit ideas that could bridge different perspectives",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      };
    }
    if (currentRound === "crux") {
      return {
        title: "Identify Cruxes ⚡",
        description:
          "What are the core disagreements? Get to the heart of the matter",
        color: "text-red-600",
        bgColor: "bg-red-50",
      };
    }
    if (currentRound === "plurality") {
      return {
        title: "Discover Pluralities 💎",
        description:
          "Share underrepresented perspectives and minority viewpoints",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      };
    }
    return {
      title: "Share Your Take 💭",
      description:
        "Submit your initial statement on this topic",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    };
  };

  const roundInfo = getRoundInfo();

  if (!isActive) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Round ended - time to vote!</p>
      </div>
    );
  }

  return (
    <motion.div
      className={`p-6 rounded-lg border-2 ${roundInfo.bgColor} border-opacity-20`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4">
        <h3 className={`${roundInfo.color} mb-1`}>
          {roundInfo.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {roundInfo.description}
        </p>
      </div>

      {currentRound !== "initial" && (
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={
              selectedType === "bridge" ? "default" : "outline"
            }
            onClick={() =>
              setSelectedType(
                selectedType === "bridge" ? null : "bridge",
              )
            }
            className="flex items-center gap-1"
          >
            🌉 Bridge
          </Button>
          <Button
            size="sm"
            variant={
              selectedType === "crux" ? "default" : "outline"
            }
            onClick={() =>
              setSelectedType(
                selectedType === "crux" ? null : "crux",
              )
            }
            className="flex items-center gap-1"
          >
            ⚡ Crux
          </Button>
          <Button
            size="sm"
            variant={
              selectedType === "plurality"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setSelectedType(
                selectedType === "plurality"
                  ? null
                  : "plurality",
              )
            }
            className="flex items-center gap-1"
          >
            💎 Plurality
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <Textarea
          value={statement}
          onChange={(e) => handleStatementChange(e.target.value)}
          placeholder={
            placeholder ||
            "What's your take? Spicy takes welcome! 🌶️"
          }
          className={`min-h-[100px] resize-none ${
            validationError ? "border-destructive focus:border-destructive" : ""
          }`}
          maxLength={500}
        />

        {/* Validation error display */}
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {validationError}
          </motion.div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`text-sm ${
              statement.length < 5 
                ? "text-destructive" 
                : statement.length > 450 
                  ? "text-orange-600" 
                  : "text-muted-foreground"
            }`}>
              {statement.length}/500 characters
            </span>
            {statement.length > 0 && statement.length < 5 && (
              <span className="text-xs text-destructive">
                {5 - statement.length} more characters needed
              </span>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!statement.trim() || isSubmitting || !!validationError}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}