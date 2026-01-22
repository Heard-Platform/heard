import type { Statement } from "../../types";
import { SwipeInstructions } from "../SwipeInstructions";
import { SwipeIndicator } from "../SwipeIndicators";
import type { MotionValue } from "motion/react";
import { X, MessageCircle, Star } from "lucide-react";
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
  commentCount: number;
  showComments: boolean;
  getTypeIcon: (type?: string) => string | null;
  onOpenComments: () => void;
  onSuperAgree: () => void;
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
  commentCount,
  showComments,
  onOpenComments,
  onSuperAgree,
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
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSuperAgree();
              }}
              className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <Star className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSkip();
              }}
              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-190px items-center justify-center">
        <p className="text-lg leading-relaxed text-center">
          {statement.text}
        </p>
      </div>

      {showComments && isTopCard && (
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments();
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {commentCount === 0 ? "Be the first to comment" : `${commentCount} comment${commentCount === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

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