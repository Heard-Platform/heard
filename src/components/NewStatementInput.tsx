import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface NewStatementInputProps {
  onSubmitStatement: (text: string) => Promise<void>;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  onShowAccountSetupModal: (featureText: string) => void;
}

export function NewStatementInput({
  onSubmitStatement,
  allowAnonymous,
  isAnonymous,
  onShowAccountSetupModal,
}: NewStatementInputProps) {
  const [newStatementText, setNewStatementText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (value: string) => {
    if (!allowAnonymous && isAnonymous && value.length > 0) {
      onShowAccountSetupModal("responding to this post");
      return;
    }
    setNewStatementText(value);
  };

  const handleSubmitStatement = async () => {
    const trimmedText = newStatementText.trim();
    
    if (!trimmedText) return;

    if (trimmedText.length < 5) {
      toast.error("Statement must be at least 5 characters");
      return;
    }

    if (trimmedText.length > 500) {
      toast.error("Statement must be 500 characters or less");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitStatement(trimmedText);
      setNewStatementText("");
      toast.success("Statement submitted!");
    } catch (error) {
      console.error("Error submitting statement:", error);
      toast.error("Failed to submit statement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Input
          value={newStatementText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Add your opinion here"
          disabled={isSubmitting}
          maxLength={500}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmitStatement();
            }
          }}
        />
      </div>
      <Button
        onClick={handleSubmitStatement}
        disabled={isSubmitting || !newStatementText.trim()}
        size="icon"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}