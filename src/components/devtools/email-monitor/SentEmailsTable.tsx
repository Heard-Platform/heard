import { Eye } from "lucide-react";
import type { SentEmail } from "../../../types";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { formatDateTime, formatRelativeTime } from "./utils";

interface SentEmailsTableProps {
  sentEmails: SentEmail[];
  onPreview: (item: SentEmail) => void;
}

export function SentEmailsTable({ sentEmails, onPreview }: SentEmailsTableProps) {
  const recentSends = [...sentEmails].sort((a, b) => b.sentAt - a.sentAt);

  const previousSendFor = (item: SentEmail): number | null => {
    const priorSends = sentEmails.filter(
      (e) => e.recipientId === item.recipientId && e.sentAt < item.sentAt,
    );
    if (priorSends.length === 0) return null;
    return Math.max(...priorSends.map((e) => e.sentAt));
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-sm font-semibold header-3 mb-3">Sent emails</h3>
      {recentSends.length === 0 ? (
        <p className="text-sm secondary-text">Nothing sent yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sent</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Previous email to this recipient</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSends.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="secondary-text">{formatDateTime(item.sentAt)}</TableCell>
                <TableCell className="font-medium">{item.recipientEmail}</TableCell>
                <TableCell className="secondary-text-strong">{item.template}</TableCell>
                <TableCell className="secondary-text">
                  {formatRelativeTime(previousSendFor(item))}
                </TableCell>
                <TableCell>
                  {item.previewHtml ? (
                    <Button variant="outline" size="sm" onClick={() => onPreview(item)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  ) : (
                    <span className="text-xs inactive-text-soft">No preview available</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
