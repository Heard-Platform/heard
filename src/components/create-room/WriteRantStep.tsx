import { useEffect, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { MessageCircle, Lightbulb, Mic, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FunSheetCard } from "../FunSheet";
import { api } from "../../utils/api";
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

type EntryMode = "voice" | "text";

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
    rant.length > 0 ? "text" : "voice",
  );
  const [isRecording, setIsRecording] = useState(false);

  const baseRantRef = useRef<string>("");
  const finalizedRef = useRef<string[]>([]);
  const onRantChangeRef = useRef(onRantChange);

  useEffect(() => {
    onRantChangeRef.current = onRantChange;
  }, [onRantChange]);

  useEffect(() => {
    if (!isRecording) return;

    let ws: WebSocket | null = null;
    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let cancelled = false;

    baseRantRef.current = rant
      ? rant.endsWith(" ")
        ? rant
        : rant + " "
      : "";
    finalizedRef.current = [];

    function updateText(partial: string) {
      const finalized = finalizedRef.current.join(" ");
      const separator =
        finalized && partial ? " " : "";
      onRantChangeRef.current(
        baseRantRef.current + finalized + separator + partial,
      );
    }

    async function getToken(): Promise<string | null> {
      if (import.meta.env.DEV) {
        try {
          const res = await fetch("/api/assemblyai-token");
          if (res.ok) {
            const data = await res.json();
            return data.token;
          }
        } catch {}
      }
      const response = await api.getAssemblyAIToken();
      if (response.success && response.data) return response.data.token;
      return null;
    }

    function floatToPcm16(input: Float32Array): ArrayBuffer {
      const pcm16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        pcm16[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
      }
      return pcm16.buffer;
    }

    async function start() {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStream = stream;

      audioContext = new AudioContext();
      await audioContext.resume();
      const sampleRate = audioContext.sampleRate;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      const audioBuffer: ArrayBuffer[] = [];
      let wsReady = false;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        const chunk = floatToPcm16(event.inputBuffer.getChannelData(0));
        if (wsReady && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(chunk);
        } else {
          audioBuffer.push(chunk);
        }
      };

      if (cancelled) return;

      const token = await getToken();
      if (cancelled || !token) {
        if (!cancelled) setIsRecording(false);
        return;
      }

      ws = new WebSocket(
        `wss://streaming.assemblyai.com/v3/ws?speech_model=u3-rt-pro&sample_rate=${sampleRate}&token=${token}`,
      );
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        for (const chunk of audioBuffer) {
          ws!.send(chunk);
        }
        audioBuffer.length = 0;
        wsReady = true;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "Turn") {
          const text = (data.transcript || "")
            .replace(/[—–]/g, "-")
            .trim();
          if (data.end_of_turn && text) {
            finalizedRef.current.push(text);
            updateText("");
          } else if (text) {
            updateText(text);
          }
        }
      };

      ws.onerror = () => {
        if (!cancelled) setIsRecording(false);
      };

      ws.onclose = () => {
        if (!cancelled) setIsRecording(false);
      };
    }

    start().catch(() => {
      if (!cancelled) setIsRecording(false);
    });

    return () => {
      cancelled = true;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ terminate_session: true }));
        ws.close();
      }
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [
    // "rant" is excluded as a dependency so transcripts append correctly.
    isRecording,
  ]);

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
              mode === "voice" ? " justify-center" : ""
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
            {mode === "text" && (
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

          {mode === "voice" ? (
            <div className="flex flex-col items-center gap-4 pt-2 pb-2">
              <button
                type="button"
                onClick={handleStartRecording}
                aria-label="Start recording"
                style={{ width: MIC_BUTTON_SIZE_PX, height: MIC_BUTTON_SIZE_PX }}
                className="rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:opacity-90 shadow-lg shadow-red-500/50 flex items-center justify-center p-0 cursor-pointer"
              >
                <Mic
                  className="text-white"
                  style={{ width: MIC_ICON_SIZE_PX, height: MIC_ICON_SIZE_PX }}
                />
              </button>
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
            <motion.div
              animate={
                isRecording
                  ? {
                      boxShadow: [
                        "0 8px 20px -3px rgba(239, 68, 68, 0.25)",
                        "0 8px 30px -3px rgba(239, 68, 68, 0.6)",
                      ],
                    }
                  : { boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
              }
              transition={
                isRecording
                  ? {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse" as const,
                      ease: "easeInOut",
                    }
                  : { duration: 0.3 }
              }
              className="rounded-md"
            >
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
                    ? "border-2 border-red-400"
                    : "border-teal-200 hover:border-teal-300 transition-colors"
                }`}
                rows={8}
              />
            </motion.div>
          )}

          <div className="flex justify-between items-center text-xs">
            {mode === "text" && (
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
            )}
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
