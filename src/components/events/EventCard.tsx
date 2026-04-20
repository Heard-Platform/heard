import { CalendarDays, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../ui/card";
import { FEED_CARD_WIDTH } from "../../utils/constants/general";
import { EventSummary } from "../../types";

export interface EventCardProps {
  event: EventSummary;
  onOpen: (eventId: string) => void;
}

export function EventCard({ event, onOpen }: EventCardProps) {
  return (
    <motion.div
      onClick={() => onOpen(event.id)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${FEED_CARD_WIDTH} cursor-pointer`}
    >
      <Card className="heard-card-bg overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <div className="shrink-0 w-11 h-11 rounded-2xl heard-primary-gradient flex items-center justify-center shadow-md">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Event
            </span>
            <p className="font-bold text-foreground leading-snug truncate">
              {event.name}
            </p>
            {event.subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {event.subtitle}
              </p>
            )}
          </div>

          <ChevronRight className="shrink-0 w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  );
}
