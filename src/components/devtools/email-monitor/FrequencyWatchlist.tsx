import { Users } from "lucide-react";
import type { SentEmail } from "../../../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { buildFrequencyWatchlist, WARN_24H, WARN_3D, WARN_7D, WARN_30D } from "./utils";

interface FrequencyWatchlistProps {
  sentEmails: SentEmail[];
}

export function FrequencyWatchlist({ sentEmails }: FrequencyWatchlistProps) {
  const frequencyWatchlist = buildFrequencyWatchlist(sentEmails);

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 secondary-text" />
        <h3 className="text-sm font-semibold header-3">Frequency watchlist</h3>
      </div>
      <p className="text-xs inactive-text-soft mb-3">
        Every recipient we've emailed recently, sorted with the most-emailed first.
      </p>
      {frequencyWatchlist.length === 0 ? (
        <p className="text-sm secondary-text">No sends recorded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Sent (24h)</TableHead>
              <TableHead>Sent (3d)</TableHead>
              <TableHead>Sent (7d)</TableHead>
              <TableHead>Sent (30d)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {frequencyWatchlist.map((w) => (
              <TableRow key={w.recipientId}>
                <TableCell className="font-medium">{w.email}</TableCell>
                <TableCell className={w.sentLast24h > WARN_24H ? "font-semibold attention-text" : ""}>
                  {w.sentLast24h}
                </TableCell>
                <TableCell className={w.sentLast3d > WARN_3D ? "font-semibold attention-text" : ""}>
                  {w.sentLast3d}
                </TableCell>
                <TableCell className={w.sentLast7d > WARN_7D ? "font-semibold attention-text" : ""}>
                  {w.sentLast7d}
                </TableCell>
                <TableCell className={w.sentLast30d > WARN_30D ? "font-semibold attention-text" : ""}>
                  {w.sentLast30d}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
