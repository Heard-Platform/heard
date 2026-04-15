import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { WriteRantStep } from "../components/create-room/WriteRantStep";
import { FunSheetCard } from "../components/FunSheet";
import { Textarea } from "../components/ui/textarea";

const MOCK_RANT = "The DC Metro needs to run 24/7 like NYC to support nightlife and shift workers";

const MIN_RANT_LENGTH = 20;

const errorStates: { label: string; error: string | null; warning: string | null }[] = [
  {
    label: "Mic denied",
    error: "Couldn't access your microphone. Please check your browser permissions.",
    warning: null,
  },
  {
    label: "Failed to start",
    error: "Failed to start recording. Please try again.",
    warning: null,
  },
  {
    label: "Connection failed",
    error: "Something went wrong with the recording. Please try again.",
    warning: null,
  },
  {
    label: "Disconnected",
    error: "Recording was disconnected. Please try again.",
    warning: null,
  },
  {
    label: "No audio (warning)",
    error: null,
    warning:
      "Hmmm... We can't hear you! Please make sure you have your system audio input device set to your microphone.",
  },
];

function MessagePreview({
  label,
  error,
  warning,
}: {
  label: string;
  error: string | null;
  warning: string | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <FunSheetCard delay={0}>
        <div className="space-y-3">
          <Textarea
            readOnly
            value={MOCK_RANT}
            className="w-full min-h-[120px] resize-none bg-white border-teal-200 text-sm"
            rows={4}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          {warning && <p className="text-xs text-yellow-600">{warning}</p>}
        </div>
      </FunSheetCard>
    </div>
  );
}

export function WriteRantStepStory() {
  const [rant, setRant] = useState("");
  const remainingChars = Math.max(0, MIN_RANT_LENGTH - rant.trim().length);
  const isRantValid = rant.trim().length >= MIN_RANT_LENGTH;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="messages">Message States</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="pt-4">
          <WriteRantStep
            rant={rant}
            isRantValid={isRantValid}
            remainingChars={remainingChars}
            onRantChange={setRant}
          />
        </TabsContent>

        <TabsContent value="messages" className="pt-4 space-y-4">
          {errorStates.map((s) => (
            <MessagePreview
              key={s.label}
              label={s.label}
              error={s.error}
              warning={s.warning}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
