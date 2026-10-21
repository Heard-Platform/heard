import { useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Lightbulb, Lock, Mic, Square, X } from "lucide-react";
import { Button } from "../ui/button";
import { useVoiceTranscription } from "../../hooks/useVoiceTranscription";
import { topicExamples } from "./rant-examples";
import { MAX_RANT_LENGTH, MIN_RANT_LENGTH } from "./create-post-utils";

interface RantStepProps {
  rant: string;
  isExtracting?: boolean;
  initialShowExamples?: boolean;
  onRantChange: (rant: string) => void;
  onContinue: () => void;
  onCreateManually: () => void;
}

export function RantStep({
  rant,
  isExtracting = false,
  initialShowExamples = false,
  onRantChange,
  onContinue,
  onCreateManually,
}: RantStepProps) {
  const [showExamples, setShowExamples] = useState(initialShowExamples);
  const { isRecording, recordingError, recordingWarning, startRecording, stopRecording } =
    useVoiceTranscription(onRantChange);

  const trimmedLength = rant.trim().length;
  const isRantValid = trimmedLength >= MIN_RANT_LENGTH;
  const remainingChars = MIN_RANT_LENGTH - trimmedLength;

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    setShowExamples(false);
    startRecording(rant);
  };

  const handleTextAreaTap = (e: MouseEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    flushSync(() => {
      stopRecording();
    });
    // iOS Safari won't show the keyboard from a tap on a readOnly textarea, so we re-focus after flushSync flips readOnly off.
    el.blur();
    el.focus();
  };

  const handleExampleClick = (topic: string) => {
    onRantChange(topic);
    setShowExamples(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <div className="relative flex min-h-32 flex-1">
        <label htmlFor="rant-input" className="sr-only">
          Your rant
        </label>
        <textarea
          id="rant-input"
          value={rant}
          maxLength={MAX_RANT_LENGTH}
          readOnly={isRecording}
          placeholder="Rant away. We'll turn it into a post people can vote on."
          onChange={(e) => onRantChange(e.target.value)}
          onClick={isRecording ? handleTextAreaTap : undefined}
          className={`flex-1 resize-none rounded-[14px] border-[1.5px] bg-white px-3.5 pt-3 pb-14 text-base leading-normal text-foreground outline-none placeholder:text-muted-foreground ${
            isRecording ? "recording-border" : "creation-soft-border creation-input"
          }`}
        />
        {rant.length > 0 && !isRecording && (
          <Button
            type="button"
            variant="ghost"
            aria-label="Clear and start over"
            onClick={() => onRantChange("")}
            className="absolute top-1 right-1 size-11 p-0 secondary-text"
          >
            <X className="size-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowExamples((prev) => !prev)}
          className="creation-strong-text absolute bottom-2 left-2 h-11 gap-1.5 px-2 text-sm font-semibold"
        >
          <Lightbulb className="size-4" />
          {showExamples ? "Hide ideas" : "Need inspiration?"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleToggleRecording}
          className={`absolute right-2 bottom-2 h-11 gap-1.5 rounded-full bg-white px-3 text-sm font-medium ${
            isRecording ? "recording-border recording-text" : "normal-border secondary-text-strong"
          }`}
        >
          {isRecording ? <Square className="size-3.5 fill-current" /> : <Mic className="size-[18px]" />}
          {isRecording ? "Stop" : "Talk instead"}
        </Button>
      </div>

      {showExamples && (
        <ul className="max-h-40 shrink-0 space-y-1.5 overflow-y-auto" aria-label="Rant ideas">
          {topicExamples.map((topic) => (
            <li key={topic}>
              <button
                type="button"
                onClick={() => handleExampleClick(topic)}
                className="w-full rounded-xl border inactive-border bg-white px-3 py-2.5 text-left text-sm leading-snug text-foreground"
              >
                {topic}
              </button>
            </li>
          ))}
        </ul>
      )}

      {recordingError && <p className="shrink-0 text-xs invalid-text">{recordingError}</p>}
      {recordingWarning && <p className="shrink-0 text-xs attention-text">{recordingWarning}</p>}

      <div className="flex shrink-0 items-center justify-between gap-2 text-xs secondary-text-strong">
        <span className="flex items-center gap-1.5">
          <Lock aria-hidden="true" className="size-3" />
          Private. Only used to draft your post.
        </span>
        {trimmedLength > 0 && !isRantValid ? (
          <span className="shrink-0 attention-text">
            {remainingChars} more {remainingChars === 1 ? "character" : "characters"}
          </span>
        ) : (
          <span className="shrink-0">
            {rant.length}/{MAX_RANT_LENGTH}
          </span>
        )}
      </div>

      <Button
        type="button"
        onClick={onContinue}
        disabled={!isRantValid || isExtracting}
        className={`h-13 shrink-0 rounded-2xl text-[17px] font-bold disabled:opacity-100 ${
          isRantValid ? "creation-solid-bg" : "inactive-bg secondary-text-strong"
        }`}
      >
        {isExtracting ? "Working on it..." : "Continue"}
      </Button>
      <button
        type="button"
        onClick={onCreateManually}
        className="creation-strong-text mx-auto min-h-6 shrink-0 text-sm font-medium underline underline-offset-4"
      >
        Create post manually
      </button>
    </div>
  );
}
