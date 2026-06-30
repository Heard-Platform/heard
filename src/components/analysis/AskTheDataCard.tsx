import { useState, type KeyboardEvent } from "react";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { api } from "../../utils/api";

interface AskResult {
  question: string;
  status: "answered" | "rejected";
  response: string;
}

interface AskTheDataCardProps {
  debateId: string;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

const STARTER_QUESTIONS = [
  "Find the common ground",
  "Summarize the opinion groups",
  "What's most divisive?",
];

export function AskTheDataCard({ debateId }: AskTheDataCardProps) {
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAsk = question.trim().length > 0 && !isAsking;

  const askQuestion = async (raw: string) => {
    const q = raw.trim();
    if (q.length === 0 || isAsking) return;

    setIsAsking(true);
    setError(null);
    let succeeded = false;
    try {
      const response = await api.askTheData(debateId, q);
      if (response.success && response.data) {
        setResult({ question: q, ...response.data });
        succeeded = true;
      } else {
        setError(response.error || GENERIC_ERROR);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR);
    } finally {
      setIsAsking(false);
      // Clear the box on success; keep the question on error so it can be edited and resubmitted.
      setQuestion(succeeded ? "" : q);
    }
  };

  const handleAsk = () => askQuestion(question);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits; Shift+Enter inserts a newline. Ignore Enter while an IME is composing.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl">Ask the Data</h2>

        <div className="flex flex-wrap gap-2">
          {STARTER_QUESTIONS.map((starter) => (
            <Button
              key={starter}
              variant="outline"
              size="sm"
              onClick={() => askQuestion(starter)}
              disabled={isAsking}
            >
              {starter}
            </Button>
          ))}
        </div>

        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask any question about this conversation."
          disabled={isAsking}
          rows={3}
        />

        <div className="flex">
          <Button onClick={handleAsk} disabled={!canAsk} className="w-32">
            {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">You asked</p>
              <p className="text-sm">{result.question}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {result.status === "rejected" ? "Out of scope" : "Answer"}
              </p>
              <p
                className={
                  result.status === "rejected"
                    ? "text-sm text-amber-600"
                    : "text-sm"
                }
              >
                {result.response}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
