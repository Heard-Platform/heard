import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner@2.0.3";

interface NewStatementInputProps {
  onSubmitStatement: (text: string) => Promise<void>;
}

export function NewStatementInput({
  onSubmitStatement,
}: NewStatementInputProps) {
  const [newStatementText, setNewStatementText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitStatement = async () => {
    if (!newStatementText.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitStatement(newStatementText.trim());
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
      <Input
        value={newStatementText}
        onChange={(e) => setNewStatementText(e.target.value)}
        placeholder="Add your own statement..."
        disabled={isSubmitting}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmitStatement();
          }
        }}
        className="flex-1"
      />
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
