import { motion } from "motion/react";
import { Users, Sparkles, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../ui/card";
import { AddConversationCard } from "./AddConversationCard";
import { EventRoomListing } from "./EventRoomListing";
import { Event } from "../../types";

const STATS = (
  needsInput: number,
  caughtUp: number,
  total: number,
) => [
  {
    value: needsInput,
    labelKey: "statToVote",
    g: "attention-gradient",
    bg: "attention-bg",
    textColor: "attention-text",
  },
  {
    value: caughtUp,
    labelKey: "statCaughtUp",
    g: "resolved-gradient",
    bg: "resolved-bg",
    textColor: "resolved-text",
  },
  {
    value: total,
    labelKey: "statCompleted",
    g: "neutral-gradient",
    bg: "neutral-background",
    textColor: "neutral-text",
  },
];

export interface EventPageProps {
  event: Event;
  onAddRoom: () => void;
  onOpenRoom: (roomId: string) => void;
}

export function EventPage({
  event,
  onAddRoom,
  onOpenRoom,
}: EventPageProps) {
  const { t } = useTranslation("events");
  const {
    name: eventName,
    subtitle: eventSubtitle,
    totalMembers,
    rooms,
  } = event;

  const needsInput = rooms.filter((r) => r.status === "needs_input");
  const caughtUp = rooms.filter((r) => r.status === "caught_up");
  const completed = rooms.filter((r) => r.status === "completed");

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="heard-card-bg overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {eventName}
                </h2>
                {eventSubtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {eventSubtitle}
                  </p>
                )}
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full text-white heard-primary-gradient shadow-md whitespace-nowrap">
                <Users className="w-3 h-3" /> {t("peopleCount", { count: totalMembers })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STATS(
                needsInput.length,
                caughtUp.length,
                completed.length,
              ).map(({ value, labelKey, g, bg, textColor }) => (
                <div
                  key={labelKey}
                  className={`rounded-xl ${bg} p-2 text-center`}
                >
                  <p
                    className={`text-2xl font-black bg-gradient-to-br ${g} bg-clip-text text-transparent leading-none`}
                  >
                    {value}
                  </p>
                  <p
                    className={`text-[10px] font-semibold ${textColor} leading-tight`}
                  >
                    {t(labelKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {[
        {
          rooms: needsInput,
          labelKey: "sectionNeedsVotes",
          icon: (
            <Sparkles className="w-3 h-3 inline-block mr-1 text-orange-400" />
          ),
          delay: 0.15,
        },
        {
          rooms: caughtUp,
          labelKey: "sectionCaughtUp",
          icon: null,
          delay: 0.25,
          offset: needsInput.length,
        },
        {
          rooms: completed,
          labelKey: "sectionCompleted",
          icon: (
            <CheckCheck className="w-3 h-3 inline-block mr-1 text-muted-foreground" />
          ),
          delay: 0.35,
          offset: needsInput.length + caughtUp.length,
        },
      ].map(
        ({ rooms: group, labelKey, icon, delay, offset = 0 }) =>
          group.length > 0 && (
            <motion.div
              key={labelKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                  {icon}
                  {t(labelKey)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {group.map((room, i) => (
                <EventRoomListing
                  key={room.id}
                  room={room}
                  event={event}
                  index={offset + i}
                  onCtaClick={() => onOpenRoom(room.id)}
                />
              ))}
            </motion.div>
          ),
      )}

      <AddConversationCard
        isEmpty={rooms.length === 0}
        onAddRoom={onAddRoom}
      />
    </div>
  );
}
