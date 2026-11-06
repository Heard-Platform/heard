import type { EventReportOpenCount } from "../../../types";

interface EventReportOpensListProps {
  openCountsByEvent: EventReportOpenCount[];
}

export function EventReportOpensList({
  openCountsByEvent,
}: EventReportOpensListProps) {
  if (openCountsByEvent.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1 text-sm">
      {openCountsByEvent.map((eventOpenCount) => (
        <li
          key={eventOpenCount.eventId}
          className="flex justify-between gap-4"
        >
          <span className="truncate">{eventOpenCount.eventName}</span>
          <span className="font-semibold tabular-nums">
            {eventOpenCount.openCount}
          </span>
        </li>
      ))}
    </ul>
  );
}
