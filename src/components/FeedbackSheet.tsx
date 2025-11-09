import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { MessageSquare, Heart } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { FunSheet, FunSheetCard } from "./FunSheet";

interface FeedbackSheetProps {
  userId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FeedbackSheet({ userId, trigger, open: controlledOpen, onOpenChange }: FeedbackSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please write something!");
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await api.submitFeedback(feedbackText, userId);
      
      if (response.success) {
        toast.success("Feedback sent! We read every single one 💜");
        setFeedbackText("");
        setOpen(false);
      } else {
        toast.error("Failed to send feedback. Please try again!");
        console.error("Feedback submission error:", response.error);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again!");
      console.error("Error submitting feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FunSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger !== null ? (trigger || (
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Give Feedback
        </Button>
      )) : undefined}
      title="Help Us Build Heard!"
      description="Your feedback shapes the future of debating! 💜"
      leftIcon={Heart}
      rightIcon={MessageSquare}
      theme="purple"
      buttonText="Send Feedback 💜"
      buttonLoadingText="Sending your feedback..."
      buttonIcon={Heart}
      onButtonClick={handleSubmit}
      buttonDisabled={!feedbackText.trim()}
      isLoading={submitting}
    >
      {/* Feedback Text */}
      <FunSheetCard delay={0.2} borderColor="border-purple-100">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <Label className="text-base text-slate-700">What's on your mind?</Label>
          </div>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Bug report? Feature idea? Just saying hi? Tell us anything! The more details, the better. 💜"
            className="w-full min-h-[120px] resize-none bg-white border-purple-200 hover:border-purple-300 transition-colors placeholder:text-slate-400"
            disabled={submitting}
            rows={5}
          />
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">
              No idea is too wild! 💡
            </span>
            {feedbackText.length > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-400"
              >
                {feedbackText.length} characters
              </motion.span>
            )}
          </div>
        </div>
      </FunSheetCard>

      {/* Encouraging Message */}
      <FunSheetCard delay={0.25} borderColor="border-pink-100">
        <p className="text-sm text-center text-slate-600">
          💡 We're building "Mario Party for debating" - let's make it legendary together!
        </p>
      </FunSheetCard>
    </FunSheet>
  );
}
