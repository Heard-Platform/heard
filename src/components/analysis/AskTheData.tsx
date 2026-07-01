import { useState, type KeyboardEvent } from "react";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { ArrowUp, Flag, Loader2 } from "lucide-react";
import { useDebateSession } from "../../hooks/useDebateSession";
import { api } from "../../utils/api";
import { AskTheDataResponse } from "../../types/api-responses";

interface AskResult extends AskTheDataResponse {
  question: string;
}

interface AskTheDataProps {
  debateId: string;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

const STARTER_QUESTIONS = [
  "What is an insight from this conversation?",
  "Are there blindspots not covered by the responses?",
  "What common ground could there be between people who disagreed?",
];

export function AskTheData({ debateId }: AskTheDataProps) {
  const { askTheData, flagAskTheDataResponse } = useDebateSession();
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);

  const canAsk = question.trim().length > 0 && !isAsking;

  const askQuestion = async (raw: string) => {
    const q = raw.trim();
    if (q.length === 0 || isAsking) return;

    setIsAsking(true);
    setError(null);
    let succeeded = false;
    api.trackEvent("ask_the_data_question_submitted", debateId);
    try {
      const response = await askTheData(debateId, q);
      if (response.success && response.data) {
        setResult({ question: q, ...response.data });
        setFlagged(false);
        succeeded = true;
      } else {
        setError(response.error || GENERIC_ERROR);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR);
    } finally {
      setIsAsking(false);
      setQuestion(succeeded ? "" : q);
    }
  };

  const handleAsk = () => askQuestion(question);

  const submitOnEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handlePresetClick = (preset: string) => {
    api.trackEvent("ask_the_data_preset_clicked", debateId);
    askQuestion(preset);
  };

  const handleFlag = () => {
    if (!result || flagged) return;
    setFlagged(true);
    api.trackEvent("ask_the_data_flagged", debateId);
    flagAskTheDataResponse(result.id, debateId, "");
  };

  const handleUsageClick = () => {
    api.trackEvent("ask_the_data_ai_usage_link_clicked", debateId);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl">Ask the Data</h2>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {STARTER_QUESTIONS.map((starter) => (
            <Button
              key={starter}
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(starter)}
              disabled={isAsking}
              className="h-auto w-full justify-start whitespace-normal py-2 text-left"
            >
              {starter}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={submitOnEnter}
            placeholder="Ask any question about this conversation."
            disabled={isAsking}
            rows={3}
            className="pr-12"
          />
          <Button
            onClick={handleAsk}
            disabled={!canAsk}
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
          >
            {isAsking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">You asked:</p>
              <p className="text-sm">{result.question}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Answer:</p>
              <p
                className={
                  result.status === "rejected"
                    ? "text-sm negative-text"
                    : "text-sm"
                }
              >
                {result.response}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={flagged}
              onClick={handleFlag}
              className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground"
            >
              <Flag className="h-3 w-3" />
              {flagged ? "Thanks for letting us know" : "Flag as unhelpful"}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          We are committed to using AI as responsibly as possible,{" "}
          <a
            href="https://heard.vote/ai-usage"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleUsageClick}
            className="underline hover:text-foreground"
          >
            track our usage here
          </a>
          .
        </p>
      </div>
    </Card>
  );
}
