import { useEffect, type CSSProperties } from "react";
import type { MotionValue } from "motion/react";
import { Check, MessageSquare, Pencil, X } from "lucide-react";
import type { FeedbackStatement } from "../../utils/constants/feedback-statements";
import { SwipeIndicatorSet } from "../SwipeIndicators";
import { api } from "../../utils/api";
import { VoteButton } from "../VoteButton";
import { Button } from "../ui/button";

export const FEEDBACK_CARD_SHELL_CLASS = "bg-[#3b2a20] border-[#3b2a20] text-stone-50";
export const FEEDBACK_FONT_STYLE: CSSProperties = { fontFamily: "'Inter', system-ui, sans-serif" };

interface FeedbackCardProps {
  roomId: string;
  statement: FeedbackStatement;
  isTopCard: boolean;
  disagreeOpacity: MotionValue<number>;
  agreeOpacity: MotionValue<number>;
  superAgreeOpacity: MotionValue<number>;
  passOpacity: MotionValue<number>;
  onAgree: () => void;
  onDisagree: () => void;
  onTellMore: () => void;
}

interface FeedbackPillProps {
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function FeedbackPill({
  label = "Feedback on Heard",
  showIcon = true,
  className = "self-start",
}: FeedbackPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 text-[13px] font-bold tracking-wide text-stone-900 ${className}`}
      style={FEEDBACK_FONT_STYLE}
    >
      {showIcon && <MessageSquare className="w-4 h-4" />}
      {label}
    </span>
  );
}

export function FeedbackCard({
  roomId,
  statement,
  isTopCard,
  disagreeOpacity,
  agreeOpacity,
  superAgreeOpacity,
  passOpacity,
  onAgree,
  onDisagree,
  onTellMore,
}: FeedbackCardProps) {
  useEffect(() => {
    if (isTopCard) {
      api.trackEvent("feedback_card_shown", roomId);
    }
  }, [isTopCard, roomId]);

  return (
    <div className="flex flex-col gap-3" style={FEEDBACK_FONT_STYLE}>
      <div className="flex min-h-190px flex-col items-center justify-center gap-3">
        <FeedbackPill label="Feedback card" showIcon={false} className="self-center" />
        <p className="text-[22px] font-semibold leading-snug text-center text-stone-50">
          {statement.text}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-center text-stone-300">
          This feedback helps us improve Heard
        </p>

        {isTopCard && (
          <div className="grid grid-cols-3 gap-2">
            <VoteButton label="Disagree" vote="disagree" icon={<X />} onClick={onDisagree} />
            <Button variant="outline" size="lg" className="border-2 border-amber-300 px-1" onClick={onTellMore}>
              <span className="flex items-center gap-1 font-bold text-amber-700">
                <Pencil />
                Add note
              </span>
            </Button>
            <VoteButton label="Agree" vote="agree" icon={<Check />} onClick={onAgree} />
          </div>
        )}
      </div>

      {isTopCard && (
        <SwipeIndicatorSet
          disagreeOpacity={disagreeOpacity}
          agreeOpacity={agreeOpacity}
          superAgreeOpacity={superAgreeOpacity}
          passOpacity={passOpacity}
        />
      )}
    </div>
  );
}
