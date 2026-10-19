import { useState } from "react";
import { X } from "lucide-react";
import type { UserEvent } from "../../../types";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { EventCountsGrid } from "./EventCountsGrid";
import { RecentEventsTable } from "./RecentEventsTable";
import { buildEventDayCounts, filterToTimelineWindow } from "./event-timeline-utils";

interface EventTimelineTabProps {
  events: UserEvent[];
  now?: number;
}

export function EventTimelineTab({ events, now = Date.now() }: EventTimelineTabProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const windowedEvents = filterToTimelineWindow(events, now);
  const grid = buildEventDayCounts(windowedEvents, now);
  const tableEvents = selectedType
    ? windowedEvents.filter((event) => event.type === selectedType)
    : windowedEvents;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl">Events per Day</h2>
          <p className="text-xs mt-1 text-muted-foreground">
            Every tracked event from real, non-developer users over the last 7 days (local time).{" "}
            {windowedEvents.length.toLocaleString()} total. Click a row to filter the table below.
          </p>
        </div>
        <EventCountsGrid grid={grid} selectedType={selectedType} onSelectType={setSelectedType} />
      </Card>

      <Card className="p-6">
        <div className="heard-between mb-4">
          <h2 className="text-xl">
            {selectedType ? (
              <>
                Events: <span className="font-mono text-base">{selectedType}</span>
              </>
            ) : (
              "All Events"
            )}
          </h2>
          {selectedType && (
            <Button variant="outline" size="sm" onClick={() => setSelectedType(null)}>
              <X className="w-4 h-4 mr-1" />
              Clear filter
            </Button>
          )}
        </div>
        <RecentEventsTable events={tableEvents} />
      </Card>
    </div>
  );
}
