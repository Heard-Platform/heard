import { useEffect, useState } from "react";
import type { EventSummary } from "../../types";
import { api, safelyMakeApiCall } from "../../utils/api";
import { EventList } from "./EventList";

interface EventListContainerProps {
  communityName: string;
  onOpenEvent: (eventId: string) => void;
}

export function EventListContainer({
  communityName,
  onOpenEvent,
}: EventListContainerProps) {
  const [events, setEvents] = useState<EventSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    safelyMakeApiCall(() => api.getEvents(communityName)).then(
      (response) => {
        if (!cancelled && response?.data) {
          setEvents(response.data.events);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [communityName]);

  return <EventList events={events} onOpenEvent={onOpenEvent} />;
}
