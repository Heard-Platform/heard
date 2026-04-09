import { useEffect, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { MessageCircle, Lightbulb, Mic, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FunSheetCard } from "../FunSheet";
import _ from "lodash";

const topicExamples = _.shuffle([
  "The 14th St Trader Joe's parking lot is a mess and they should limit its use",
  "Pineapple on pizza is actually good, even if it's a little weird",
  "Men In Black 3 is an underrated sequel! (But MIB 2 was no good)",
  "The best way to eat Oreos is to dunk them in orange juice",
  "We need more green spaces around the city, even if it means fewer parking spots",
  "People who don't like cats just haven't met the right one yet",
  "The DC Metro needs to run 24/7 like NYC to support nightlife and shift workers",
  "Breakfast foods are superior to all other meals and should be eaten at any time",
]);

type EntryMode = "initial" | "text";

const SPEECH_RECOGNITION_SUPPORTED =
  typeof window !== "undefined" &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// CN-10
const MIC_BUTTON_SIZE_PX = 128;
const MIC_ICON_SIZE_PX = 80;

interface WriteRantStepProps {
  rant: string;
  isRantValid: boolean;
  remainingChars: number;
  onRantChange: (rant: string) => void;
}

export function WriteRantStep({
  rant,
  isRantValid,
  remainingChars,
  onRantChange,
}: WriteRantStepProps) {
  const [showExamples, setShowExamples] = useState(false);
  const [mode, setMode] = useState<EntryMode>(() =>
    !SPEECH_RECOGNITION_SUPPORTED || rant.length > 0 ? "text" : "initial",
  );
  const [isRecording, setIsRecording] = useState(false);

  const baseRantRef = useRef<string>("");
  const onRantChangeRef = useRef(onRantChange);

  useEffect(() => {
    onRantChangeRef.current = onRantChange;
  }, [onRantChange]);

  useEffect(() => {
    if (!isRecording) return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    baseRantRef.current = rant
      ? rant.endsWith(" ")
        ? rant
        : rant + " "
      : "";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onRantChangeRef.current(baseRantRef.current + transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
    } catch {
      setIsRecording(false);
      return;
    }

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* noop */
      }
    };
    // CN-11
  }, [isRecording]);

  const handleStartRecording = () => {
    setMode("text");
    setShowExamples(false);
    setIsRecording(true);
  };

  const handleSwitchToText = () => {
    setMode("text");
  };

  const handleToggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  const handleNeedInspirationClick = () => {
    if (mode === "initial") {
      setMode("text");
      setShowExamples(true);
      return;
    }
    setShowExamples((prev) => !prev);
  };

  const handleExampleClick = (topic: string) => {
    onRantChange(topic);
    setShowExamples(false);
  };

  return (
    <>
      {/* Rant Input */}
      <FunSheetCard delay={0.2}>
        <div className="space-y-3">
          <div
            className={`flex items-center gap-2${
              mode === "initial" ? " justify-center" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-teal-600" />
              <Label
                htmlFor="rant-input"
                className="text-base text-slate-700"
              >
                What's got you fired up?
              </Label>
            </div>
            {SPEECH_RECOGNITION_SUPPORTED && mode === "text" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleRecording}
                className={`flex items-center gap-1.5 ${
                  isRecording
                    ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
                    : "bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:text-green-900"
                }`}
              >
                {isRecording ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
                {isRecording ? "Stop recording" : "Begin recording"}
              </Button>
            )}
          </div>

          {mode === "initial" ? (
            <div className="flex flex-col items-center gap-4 pt-2 pb-2">
              <Button
                type="button"
                onClick={handleStartRecording}
                aria-label="Start recording"
                style={{ width: MIC_BUTTON_SIZE_PX, height: MIC_BUTTON_SIZE_PX }}
                className="rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:opacity-90 shadow-lg shadow-red-500/50 flex items-center justify-center p-0"
              >
                <Mic
                  className="text-white"
                  style={{ width: MIC_ICON_SIZE_PX, height: MIC_ICON_SIZE_PX }}
                />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSwitchToText}
                className="text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                Type it out instead
              </Button>
            </div>
          ) : (
            <Textarea
              id="rant-input"
              placeholder="Let it all out... tell us what you really think! 🔥"
              maxLength={2000}
              value={rant}
              onChange={(e) => onRantChange(e.target.value)}
              onClick={isRecording ? () => setIsRecording(false) : undefined}
              readOnly={isRecording}
              className={`w-full min-h-[200px] resize-none bg-white placeholder:text-slate-400 ${
                isRecording
                  ? "border-2 border-red-400 shadow-lg shadow-red-500/50"
                  : "border-teal-200 hover:border-teal-300 transition-colors"
              }`}
              rows={8}
            />
          )}

          <div className="flex justify-between items-center text-xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNeedInspirationClick}
              className="text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-100/50 flex items-center gap-1 h-auto px-2 py-1 -ml-2"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showExamples ? "Hide" : "Need inspiration?"}
            </Button>
            {mode === "text" &&
              rant.trim().length > 0 &&
              !isRantValid && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-orange-600 flex items-center gap-1"
                >
                  <span>⏳</span>
                  Need {remainingChars} more character
                  {remainingChars !== 1 ? "s" : ""}
                </motion.span>
              )}
            {mode === "text" && isRantValid && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-emerald-600 flex items-center gap-1"
              >
                <span>🔥</span> That's the spirit!
              </motion.span>
            )}
            {mode === "text" && (
              <span className="text-slate-500 ml-auto">
                {rant.length}/2000
              </span>
            )}
          </div>
          <div className="flex items-start gap-2 px-3 py-2 bg-teal-50/50 border border-teal-100 rounded-lg">
            <span className="text-xs">🔒</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your rant is private — it's just used to draft the post topic and won't be visible to other users.
            </p>
          </div>
        </div>
      </FunSheetCard>

      {/* Example Topics */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden -mt-3"
          >
            {topicExamples.map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(topic)}
                  className="w-full text-left justify-start h-auto py-3 px-4 bg-white/50 hover:bg-white border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 transition-all whitespace-normal"
                >
                  <span className="mr-2 flex-shrink-0">💡</span>
                  <span className="text-sm line-clamp-2 break-words">{topic}</span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
