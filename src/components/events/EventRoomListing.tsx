import { motion } from "motion/react";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { TimeLeftBadge } from "../room/TimeLeftBadge";
import {
  themeForIndex,
} from "./constants";
import { AVATAR_EMOJIS } from "../../utils/constants/avatars";
import { Event, EventRoomStatus } from "../../types";

export function EventRoomListing({
  room,
  event,
  index,
  onCtaClick,
}: {
  room: EventRoomStatus;
  event: Event;
  index: number;
  onCtaClick: () => void;
}) {
  const { t } = useTranslation("events");
  const theme = themeForIndex(index);
  const isCaughtUp = room.status === "caught_up";
  const isCompleted = room.status === "completed";

  const actionDescription = isCompleted
    ? t("conversationEnded")
    : isCaughtUp
      ? t("nothingNew")
      : room.newStatementCount
        ? t("newStatements", { count: room.newStatementCount })
        : t("notVotedYet");

  const userActivityPill = !isCompleted && room.userHasVoted
    ? t("initialVotesAdded")
    : undefined;
  const ctaLabel = room.userHasVoted
    ? t("ctaVoteNew")
    : t("ctaAddVotes");
  const ctaBg = room.userHasVoted
    ? "mid-priority-bg"
    : "high-priority-bg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 * index }}
    >
      <Card
        className={`overflow-hidden bg-gradient-to-br ${theme.cardBg} border ${theme.border} shadow-sm`}
      >
        <div className="p-4 space-y-2">
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br ${theme.iconGradient} flex items-center justify-center text-xl shadow-md`}
            >
              {room.emoji ?? <MessageSquare className="w-5 h-5 text-white/80" />}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-foreground leading-snug">
                  {room.topic}
                </p>
                <TimeLeftBadge
                  endTime={room.endTime}
                  createdAt={room.createdAt}
                  isRealtime={!isCompleted}
                  variant="text"
                />
              </div>
              <p className="text-sm text-muted-foreground leading-snug">
                {actionDescription}
              </p>
              <div className="flex flex-col items-start gap-1.5">
                {userActivityPill && (
                  <span className="text-xs text-green-600">
                    ✓ {userActivityPill}
                  </span>
                )}
                {isCompleted ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCtaClick}
                    className="text-xs px-4 h-8 rounded-full"
                  >
                    {t("viewResults")}
                  </Button>
                ) : isCaughtUp ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t("caughtUpPill")}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={onCtaClick}
                    className={`${ctaBg} text-white font-semibold text-xs px-4 h-8 rounded-full shadow`}
                  >
                    {ctaLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-black/5">
            <div className="flex items-center -space-x-2">
              {room.participantAvatars
                .slice(0, 4)
                .map((animal, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full bg-white ring-2 ${theme.avatarRing} flex items-center justify-center text-sm leading-none shadow-sm`}
                  >
                    {AVATAR_EMOJIS[animal]}
                  </div>
                ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              <Trans
                t={t}
                i18nKey="votedRatio"
                values={{ voted: room.participants.length, total: event.totalMembers }}
                components={{ b: <span className="font-bold text-foreground" /> }}
              />
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
