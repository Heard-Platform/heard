import { useEffect, type CSSProperties } from "react";
import type { MotionValue } from "motion/react";
import { MessageSquare, Pencil } from "lucide-react";
import type { FeedbackStatement } from "../../utils/constants/feedback-statements";
import { SwipeIndicatorSet } from "../SwipeIndicators";
import { api } from "../../utils/api";

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
        <FeedbackPill label="Feedback question" showIcon={false} className="self-center" />
        <p className="text-[22px] font-semibold leading-snug text-center text-stone-50">
          {statement.text}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-center text-stone-300">
          Help improve Heard with some feedback
        </p>

        <div className="flex items-center justify-between border-t border-[#5c4536] pt-1.5">
          <button
            type="button"
            onClick={onTellMore}
            className="flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-amber-200 hover:text-amber-100"
          >
            <Pencil className="w-4 h-4" />
            Tell us more
          </button>
          {isTopCard && (
            <span className="text-[13px] text-stone-300">Swipe to answer</span>
          )}
        </div>
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
