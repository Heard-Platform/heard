import { motion } from "motion/react";
import { Users, Sparkles } from "lucide-react";
import { Card } from "../ui/card";
import { EventRoomListing } from "./EventRoomListing";
import type { Event } from "./constants";

const STATS = (
  needsInput: number,
  caughtUp: number,
  total: number,
) => [
  {
    value: needsInput,
    label: "to vote on",
    g: "attention-gradient",
    bg: "attention-background",
    t: "attention-text",
  },
  {
    value: caughtUp,
    label: "caught up",
    g: "resolved-gradient",
    bg: "resolved-background",
    t: "resolved-text",
  },
  {
    value: total,
    label: "posts total",
    g: "neutral-gradient",
    bg: "neutral-background",
    t: "neutral-text",
  },
];

export interface EventPageProps {
  event: Event;
  onOpenRoom: (roomId: string) => void;
}
  
export function EventPage({
  event,
  onOpenRoom,
}: EventPageProps) {
  const { name: eventName, subtitle: eventSubtitle, totalMembers, rooms } = event;
  
  const needsInput = rooms.filter((r) => r.status === "needs_input");
  const caughtUp = rooms.filter((r) => r.status === "caught_up");

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
                <Users className="w-3 h-3" /> {totalMembers} people
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STATS(
                needsInput.length,
                caughtUp.length,
                rooms.length,
              ).map(({ value, label, g, bg, t }) => (
                <div
                  key={label}
                  className={`rounded-xl ${bg} p-2 text-center`}
                >
                  <p
                    className={`text-2xl font-black bg-gradient-to-br ${g} bg-clip-text text-transparent leading-none`}
                  >
                    {value}
                  </p>
                  <p
                    className={`text-[10px] font-semibold ${t} leading-tight`}
                  >
                    {label}
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
          label: "Needs your votes",
          icon: (
            <Sparkles className="w-3 h-3 inline-block mr-1 text-orange-400" />
          ),
          delay: 0.15,
        },
        {
          rooms: caughtUp,
          label: "Caught up",
          icon: null,
          delay: 0.25,
          offset: needsInput.length,
        },
      ].map(
        ({ rooms: group, label, icon, delay, offset = 0 }) =>
          group.length > 0 && (
            <motion.div
              key={label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                  {icon}
                  {label}
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
    </div>
  );
}
