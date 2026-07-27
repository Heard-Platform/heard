import { useState, type KeyboardEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
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

const STARTER_KEYS = ["starter1", "starter2", "starter3"];

export function AskTheData({ debateId }: AskTheDataProps) {
  const { t } = useTranslation("analysis");
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
        setError(response.error || t("genericError"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
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
        <h2 className="text-xl">{t("askTheDataTitle")}</h2>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {STARTER_KEYS.map((key) => {
            const starter = t(key);
            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(starter)}
                disabled={isAsking}
                className="h-auto w-full justify-start whitespace-normal py-2 text-left"
              >
                {starter}
              </Button>
            );
          })}
        </div>

        <div className="relative">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={submitOnEnter}
            placeholder={t("askPlaceholder")}
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
              <p className="text-sm text-muted-foreground">{t("youAsked")}</p>
              <p className="text-sm">{result.question}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("answerLabel")}</p>
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
              {flagged ? t("thanksForFeedback") : t("flagUnhelpful")}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          <Trans
            t={t}
            i18nKey="aiResponsibility"
            components={{
              link: (
                <a
                  href="https://heard.vote/ai-usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleUsageClick}
                  className="underline hover:text-foreground"
                />
              ),
            }}
          />
        </p>
      </div>
    </Card>
  );
}
