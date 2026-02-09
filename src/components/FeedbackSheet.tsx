import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { MessageSquare, Heart, Phone, Linkedin, Instagram, Youtube, LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../utils/api";
import { FunSheet, FunSheetCard } from "./FunSheet";

// @ts-ignore
import { toast } from "sonner@2.0.3";
// @ts-ignore
import alexAvatar from "figma:asset/666a1c47b00c0b4dbc630b8672610dd57a571842.png";

interface FeedbackSheetProps {
  userId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const socialIconButtonClass = "p-2 rounded-full bg-purple-50 hover:bg-purple-100 transition-colors";
const socialIconClass = "w-5 h-5 text-purple-600";

const socials: Array<{ href: string; Icon: LucideIcon; label: string }> = [
  { href: "https://www.linkedin.com/in/alex-long-89b9a815/", Icon: Linkedin, label: "LinkedIn" },
  { href: "https://www.instagram.com/alexmasonlong/", Icon: Instagram, label: "Instagram" },
  { href: "https://www.youtube.com/@AlexLongHeard/", Icon: Youtube, label: "YouTube" },
];

export function FeedbackSheet({
  userId,
  open: controlledOpen,
  onOpenChange,
}: FeedbackSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Use controlled open state if provided, otherwise use internal state
  const open =
    controlledOpen !== undefined
      ? controlledOpen
      : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please write something!");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.submitFeedback(
        feedbackText,
        userId,
      );

      if (response.success) {
        toast.success(
          "Feedback sent! We read every single one 💜",
        );
        setFeedbackText("");
        setOpen(false);
      } else {
        toast.error(
          "Failed to send feedback. Please try again!",
        );
        console.error(
          "Feedback submission error:",
          response.error,
        );
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
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Talk to Alex
        </Button>
      }
      title="Talk to Alex"
      description="Hey! I'm Alex, the creator of Heard 👋"
      avatar={alexAvatar}
      socialButtons={
        <div className="flex items-center gap-2 mb-[-10px]">
          {socials.map(({ href, Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={socialIconButtonClass}
              aria-label={label}
            >
              <Icon className={socialIconClass} />
            </a>
          ))}
        </div>
      }
      leftIcon={Heart}
      rightIcon={Phone}
      theme="purple"
      buttonText="Send Message 💜"
      buttonLoadingText="Sending your message..."
      buttonIcon={Heart}
      onButtonClick={handleSubmit}
      buttonDisabled={!feedbackText.trim()}
      isLoading={submitting}
    >
      <FunSheetCard delay={0.1} borderColor="border-purple-100">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-purple-600" />
            <Label className="text-base text-slate-700">
              Text or call me!
            </Label>
          </div>
          <p className="text-slate-600 leading-relaxed">
            I'd love to hear from you! Text or call Alex at{" "}
            <a
              href="tel:916-234-3273"
              className="font-bold text-purple-600 hover:text-purple-700 underline decoration-2 decoration-purple-300 underline-offset-2"
            >
              916-BE-HEARD (234-3273)
            </a>{" "}
            with feedback, questions, bugs, interesting stories
            about your great grandma, or just to say hi.
          </p>
          <p className="text-slate-600 leading-relaxed">
            If you're in D.C. let's grab coffee! Here's a calendar booking link:{" "}
            <a
              href="https://calendly.com/alexmasonlong/30-minute"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-purple-600 hover:text-purple-700 underline decoration-2 decoration-purple-300 underline-offset-2"
            >
              Book a time
            </a>
          </p>
          <p className="text-slate-600 leading-relaxed">
            Or you can send a message directly below:
          </p>
        </div>
      </FunSheetCard>

      {/* Feedback Text */}
      <FunSheetCard delay={0.2} borderColor="border-purple-100">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <Label className="text-base text-slate-700">
              Send a message
            </Label>
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
    </FunSheet>
  );
}