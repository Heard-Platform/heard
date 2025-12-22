import type { Statement } from "../../types";
import { SwipeInstructions } from "../SwipeInstructions";
import { SwipeIndicator } from "../SwipeIndicators";
import type { MotionValue } from "motion/react";

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
}: StatementCardProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Anonymous
          </span>
          {statement.isSpicy && (
            <span className="text-lg">🌶️</span>
          )}
          {getTypeIcon(statement.type) && (
            <span className="text-lg">
              {getTypeIcon(statement.type)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {statement.type && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
              {statement.type.toUpperCase()}
            </span>
          )}
          {isTopCard && (
            <span className="text-xs text-muted-foreground">
              {currentIndex} / {totalStatements}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 min-h-[200px] flex items-center justify-center">
        <p className="text-lg leading-relaxed text-center">
          {statement.text}
        </p>
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
