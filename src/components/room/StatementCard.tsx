import type { Statement } from "../../types";
import { SwipeIndicator } from "../SwipeIndicators";
import type { MotionValue } from "motion/react";
import { Star, Flag, MoreVertical, EyeOff, Share, SkipForward } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useDebateSession } from "../../hooks/useDebateSession";
import { getTotalVotes } from "../../utils/votes";
import { share } from "../../utils/share";
import { createShareableLink } from "../../utils/url";
import moment from "moment";
import { useTranslation } from "react-i18next";
// @ts-ignore
import { toast } from "sonner@2.0.3";

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
  onSuperAgree: () => void;
  onSkip: () => void;
  onFlag: () => void;
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
  onSuperAgree,
  onSkip,
  onFlag,
}: StatementCardProps) {
  const { t } = useTranslation(["room", "toast"]);
  const { user, activeRooms, setStatementHidden } = useDebateSession();
  const room = activeRooms.find((r) => r.id === statement.roomId);
  const isHost = !!user && !!room && room.hostId === user.id;
  const isDeveloper = !!user?.isDeveloper;
  const timeAgo = moment(statement.timestamp).fromNow();

  const handleHide = () => {
    if (!window.confirm(t("hideResponseConfirm"))) {
      return;
    }
    setStatementHidden(statement.roomId, statement.id, true);
  };
  
  const actionButtonBase = "w-7 h-7 rounded-full transition-colors flex items-center justify-center flex-shrink-0";

  return (
    <>
      <div className="heard-between">
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
            {false && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSuperAgree();
                }}
                className={`${actionButtonBase} bg-amber-400 hover:bg-amber-500`}
              >
                <Star className="w-4 h-4 text-white" />
              </button>
            )}
            <button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onSkip();
              }}
              className={`${actionButtonBase} hover:bg-gray-100`}
              title={t("skip")}
            >
              <SkipForward className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const link = `${createShareableLink(statement.roomId)}?statement=${statement.id}`;
                share({
                  url: link,
                  title: t("shareVoteTitle"),
                  text: t("shareVoteText", { text: statement.text, link }),
                  onSuccess: () => toast.success(t("toast:linkCopied")),
                  onError: (e) => toast.error(t("toast:shareLinkFailed")),
                });
              }}
              className={`${actionButtonBase} hover:bg-gray-100`}
              title={t("shareResponse")}
            >
              <Share className="w-4 h-4 text-gray-700" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={`${actionButtonBase} hover:bg-gray-100`}
                >
                  <MoreVertical className="w-4 h-4 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onFlag()}>
                  <Flag className="w-4 h-4 mr-2 report-text" />
                  {t("report")}
                </DropdownMenuItem>
                {(isHost || isDeveloper) && (
                  <DropdownMenuItem onSelect={handleHide}>
                    <EyeOff className="w-4 h-4 mr-2" />
                    {t("hideResponse")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="flex min-h-190px items-center justify-center">
        <p className="text-lg leading-relaxed text-center">
          {statement.text}
        </p>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
        {isTopCard && (() => {
          const totalVotes = getTotalVotes(statement);
          return (
            <span className="text-xs text-muted-foreground">
              {t("voteCount", { count: totalVotes })}
            </span>
          );
        })()}
      </div>


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