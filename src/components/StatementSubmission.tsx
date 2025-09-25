import { useState } from "react";
import { motion } from "motion/react";
import { Send, Lightbulb, Zap, Target, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner@2.0.3";

type Phase =
  | "lobby"
  | "phase1"
  | "phase2"
  | "phase3"
  | "results";

interface StatementSubmissionProps {
  onSubmit: (statement: string) => Promise<void>;
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
      await onSubmit(trimmed);
      setStatement("");
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
    if (currentRound === "phase1") {
      return {
        title: "Phase 1 - Drop Your Take 💭",
        description:
          "Share what you really think about this topic",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      };
    }
    if (currentRound === "phase2") {
      return {
        title: "Phase 2 - Keep It Going 💬",
        description:
          "Add to the conversation - build on what's been said",
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    }
    if (currentRound === "phase3") {
      return {
        title: "Phase 3 - Final Thoughts 🔥",
        description:
          "Last chance to make your point - make it count",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      };
    }
    return {
      title: "Share Your Take 💭",
      description:
        "Submit your statement on this topic",
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