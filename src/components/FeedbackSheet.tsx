import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { MessageSquare, Heart, Phone, Linkedin, Instagram, Youtube, LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../utils/api";
import { FunSheet, FunSheetCard } from "./FunSheet";
import { Trans, useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["dialog", "toast"]);
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
      toast.error(t("toast:feedbackEmpty"));
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.submitFeedback(feedbackText);

      if (response.success) {
        toast.success(
          t("toast:feedbackSent"),
        );
        setFeedbackText("");
        setOpen(false);
      } else {
        toast.error(
          t("toast:feedbackFailed"),
        );
        console.error(
          "Feedback submission error:",
          response.error,
        );
      }
    } catch (error) {
      toast.error(t("toast:genericError"));
      console.error("Error submitting feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FunSheet
      open={open}
      onOpenChange={setOpen}
      title={t("feedbackTitle")}
      description={t("feedbackDescription")}
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
      buttonText={t("feedbackButton")}
      buttonLoadingText={t("feedbackButtonLoading")}
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
              {t("feedbackContactLabel")}
            </Label>
          </div>
          <p className="text-slate-600 leading-relaxed">
            <Trans
              t={t}
              i18nKey="feedbackCallText"
              components={{
                phone: (
                  <a
                    href="tel:916-234-3273"
                    className="font-bold heard-link underline decoration-2 decoration-purple-300 underline-offset-2"
                  />
                ),
              }}
            />
          </p>
          <p className="text-slate-600 leading-relaxed">
            <Trans
              t={t}
              i18nKey="feedbackCoffeeText"
              components={{
                link: (
                  <a
                    href="https://calendly.com/alexmasonlong/30-minute"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold heard-link underline decoration-2 decoration-purple-300 underline-offset-2"
                  />
                ),
              }}
            />
          </p>
          <p className="text-slate-600 leading-relaxed">
            {t("feedbackOrSend")}
          </p>
        </div>
      </FunSheetCard>

      {/* Feedback Text */}
      <FunSheetCard delay={0.2} borderColor="border-purple-100">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <Label className="text-base text-slate-700">
              {t("feedbackSendLabel")}
            </Label>
          </div>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder={t("feedbackPlaceholder")}
            className="w-full min-h-[120px] resize-none bg-white border-purple-200 hover:border-purple-300 transition-colors placeholder:text-slate-400"
            disabled={submitting}
            rows={5}
          />
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">
              {t("feedbackNoIdea")}
            </span>
            {feedbackText.length > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-400"
              >
                {t("feedbackChars", { count: feedbackText.length })}
              </motion.span>
            )}
          </div>
        </div>
      </FunSheetCard>
    </FunSheet>
  );
}