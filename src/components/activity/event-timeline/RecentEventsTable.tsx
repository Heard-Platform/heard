import { ExternalLink } from "lucide-react";
import type { UserEvent } from "../../../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { getAdminUserHistoryPath } from "../../../utils/url";
import { formatEventTime, toUrlPath } from "./event-timeline-utils";

const MAX_ROWS = 500;

function UserIdLink({ userId }: { userId: string | null }) {
  if (!userId) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <a
      href={getAdminUserHistoryPath(userId)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline"
      title="Open user history in a new tab"
    >
      {userId.slice(0, 8)}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

interface RecentEventsTableProps {
  events: UserEvent[];
}

export function RecentEventsTable({ events }: RecentEventsTableProps) {
  const newestFirst = [...events].sort((a, b) => b.createdAt - a.createdAt);
  const visibleEvents = newestFirst.slice(0, MAX_ROWS);

  if (events.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No events to show.</p>;
  }

  return (
    <div className="space-y-2">
      {events.length > MAX_ROWS && (
        <p className="text-xs text-muted-foreground">
          Showing the newest {MAX_ROWS.toLocaleString()} of {events.length.toLocaleString()} events.
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Page</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleEvents.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="text-xs whitespace-nowrap">{formatEventTime(event.createdAt)}</TableCell>
              <TableCell className="font-mono text-xs">{event.type}</TableCell>
              <TableCell>
                <UserIdLink userId={event.userId} />
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {event.roomId ? event.roomId.slice(0, 8) : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={event.url}>
                {toUrlPath(event.url) ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
