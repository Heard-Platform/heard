import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { DebateRoom } from "../../types";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface AddResponseModalProps {
  room: DebateRoom;
  open: boolean;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
}

export function AddResponseModal({
  room,
  open,
  allowAnonymous,
  isAnonymous,
  onOpenChange,
  onSubmitStatement,
  onShowAccountSetupModal,
}: AddResponseModalProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextChange = (value: string) => {
    if (!allowAnonymous && isAnonymous && value.length > 0) {
      onShowAccountSetupModal("responding to this post");
      return;
    }
    setText(value);
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();

    if (!trimmed) return;

    if (trimmed.length > 500) {
      toast.error("Statement must be 500 characters or less");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitStatement(trimmed);
      setText("");
      onOpenChange(false);
      toast.success("Response submitted!");
    } catch {
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!isSubmitting) {
      if (!next) setText("");
      onOpenChange(next);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <MessageSquare className="w-6 h-6 text-emerald-600" />
            </motion.div>
            <DialogTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Add your response
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 rounded-2xl px-4 py-3 border border-emerald-100"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-1">Topic</p>
            <p className="text-sm text-slate-700 font-medium leading-snug">{room.topic}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4"
          >
            <Textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="What do you think?"
              disabled={isSubmitting}
              maxLength={500}
              rows={4}
              className="border-0 shadow-none focus-visible:ring-0 resize-none p-0 text-base bg-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <p className="text-xs text-muted-foreground text-right mt-2">
              {text.length}/500
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !text.trim()}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
            >
              {isSubmitting ? "Submitting..." : "Submit response"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="w-full h-11 border-slate-300 hover:border-slate-400 bg-white"
            >
              Cancel
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
