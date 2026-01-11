import type { Statement } from "../../types";
import { SwipeInstructions } from "../SwipeInstructions";
import { SwipeIndicator } from "../SwipeIndicators";
import type { MotionValue } from "motion/react";
import { X } from "lucide-react";
import moment from "moment";

interface StatementCardProps {
  statement: Statement;
  isTopCard: boolean;
  currentIndex: number;
  totalStatements: number;
  disagreeOpacity: MotionValue<number>;
  agreeOpacity: MotionValue<number>;
  superAgreeOpacity: MotionValue<number>;
  passOpacity: MotionValue<number>;
  getTypeIcon: (type?: string) => string | null;
  onSkip: () => void;
}

export function StatementCard({
  statement,
  isTopCard,
  currentIndex,
  totalStatements,
  disagreeOpacity,
  agreeOpacity,
  superAgreeOpacity,
  passOpacity,
  getTypeIcon,
  onSkip,
}: StatementCardProps) {
  const timeAgo = moment(statement.timestamp).fromNow();
  const authorName = "Anonymous";

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statement.isSpicy && (
            <span className="text-lg">🌶️</span>
          )}
          {getTypeIcon(statement.type) && (
            <span className="text-lg">
              {getTypeIcon(statement.type)}
            </span>
          )}
          {statement.type && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
              {statement.type.toUpperCase()}
            </span>
          )}
        </div>
        {isTopCard && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        )}
      </div>

      <div className="flex min-h-190px items-center justify-center">
        <p className="text-lg leading-relaxed text-center">
          {statement.text}
        </p>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-xs text-muted-foreground">
          Posted by {authorName} {timeAgo}
        </span>
        {isTopCard && (
          <span className="text-xs text-muted-foreground">
            {currentIndex}/{totalStatements}
          </span>
        )}
      </div>

      {isTopCard && (
        <SwipeInstructions className="pt-2 border-t border-border/50" />
      )}

      {isTopCard && (
        <>
          <SwipeIndicator
            direction="disagree"
            opacity={disagreeOpacity}
          />
          <SwipeIndicator
            direction="agree"
            opacity={agreeOpacity}
          />
          <SwipeIndicator
            direction="superAgree"
            opacity={superAgreeOpacity}
          />
          <SwipeIndicator
            direction="pass"
            opacity={passOpacity}
          />
        </>
      )}
    </>
  );
}