import { useState, type FormEvent } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { STATEMENT_MAX_LENGTH } from "../constants";

interface AddStatementFieldProps {
  onAddStatement: (text: string) => Promise<boolean>;
}

export function AddStatementField({
  onAddStatement,
}: AddStatementFieldProps) {
  const [statementText, setStatementText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedStatementText = statementText.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmedStatementText) return;
    setIsSubmitting(true);
    const wasAdded = await onAddStatement(trimmedStatementText);
    setIsSubmitting(false);
    if (wasAdded) setStatementText("");
  };

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <Input
        className="heard-card-bg h-11 rounded-full px-4 text-base md:text-base"
        placeholder="Add your own statement"
        maxLength={STATEMENT_MAX_LENGTH}
        value={statementText}
        onChange={(event) => setStatementText(event.target.value)}
      />
      <Button
        type="submit"
        className="h-11 shrink-0 rounded-full px-5"
        disabled={!trimmedStatementText || isSubmitting}
      >
        {isSubmitting ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
