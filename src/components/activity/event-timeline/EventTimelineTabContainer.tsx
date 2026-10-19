import { useEffect, useState } from "react";
import type { UserEvent } from "../../../types";
import { api } from "../../../utils/api";
import { EventTimelineTab } from "./EventTimelineTab";

export function EventTimelineTabContainer() {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api.getRecentEvents().then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setEvents(result.data.events);
      } else {
        setError(result.error ?? "Failed to load events");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Loading events...</p>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return <EventTimelineTab events={events} />;
}
