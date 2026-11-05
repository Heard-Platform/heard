import { CalendarDays, ChevronRight } from "lucide-react";
import type { EventSummary } from "../../types";
import { Button } from "../ui/button";

interface EventListProps {
  events: EventSummary[];
  onOpenEvent: (eventId: string) => void;
}

export function EventList({ events, onOpenEvent }: EventListProps) {
  return (
    <ul className="max-h-48 space-y-1.5 overflow-y-auto">
      {events.map((event) => (
        <li key={event.id}>
          <Button
            variant="outline"
            className="h-auto w-full justify-start gap-3 py-2.5 text-left"
            onClick={() => onOpenEvent(event.id)}
          >
            <CalendarDays className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {event.name}
              </span>
              {event.subtitle && (
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {event.subtitle}
                </span>
              )}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
