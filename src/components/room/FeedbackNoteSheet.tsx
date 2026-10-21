import { useEffect, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import type { FeedbackStatement } from "../../utils/constants/feedback-statements";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "../ui/drawer";
import { FEEDBACK_FONT_STYLE, FeedbackPill } from "./FeedbackCard";

interface FeedbackNoteSheetProps {
  isOpen: boolean;
  statement: FeedbackStatement;
  onSend: (text: string) => Promise<boolean>;
  onDismiss: () => void;
}

export function FeedbackNoteSheet({ isOpen, statement, onSend, onDismiss }: FeedbackNoteSheetProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) setError(null);
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    const saved = await onSend(text.trim());
    setSending(false);
    if (saved) {
      setText("");
    } else {
      setError("Couldn't send. Please try again.");
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onDismiss()}>
      <DrawerContent className="rounded-t-3xl border-none bg-white" style={FEEDBACK_FONT_STYLE}>
        <form className="flex flex-col gap-3 px-5 pb-6 pt-5" noValidate onSubmit={handleSubmit}>
          <FeedbackPill />
          <div>
            <DrawerTitle className="text-2xl font-extrabold tracking-tight leading-tight text-stone-900">
              Tell us more
            </DrawerTitle>
            <DrawerDescription className="mt-1 text-base text-stone-600">
              On: "{statement.text}"
            </DrawerDescription>
          </div>

          <label htmlFor="feedback-note" className="sr-only">Your note</label>
          <textarea
            id="feedback-note"
            className="h-32 resize-none rounded-xl border border-stone-300 bg-white p-3 text-base text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-800"
            placeholder="What's on your mind?"
            value={text}
            disabled={sending}
            onChange={(event) => setText(event.target.value)}
          />

          <p className="flex items-center gap-1.5 text-xs text-stone-600">
            <Lock className="w-3.5 h-3.5" />
            Private. Only the Heard team sees this.
          </p>

          {error && <p className="text-center text-sm error-text">{error}</p>}

          <button
            type="submit"
            className="rounded-xl bg-stone-900 py-3 text-base font-bold text-white disabled:opacity-60"
            disabled={!text.trim() || sending}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
