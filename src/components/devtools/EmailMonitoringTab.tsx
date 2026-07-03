import { useState } from "react";
import type { ReactNode } from "react";
import type { SentEmail } from "../../types";
import { AlertTriangle, Calendar, Eye, Mail, Users } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const DAY_MS = 24 * 60 * 60 * 1000;

const WARN_24H = 1;
const WARN_3D = 2;
const WARN_7D = 3;
const WARN_30D = 8;

interface EmailMonitoringTabProps {
  sentEmails: SentEmail[];
}

const TIMELINE_DAYS = 7;
const TEMPLATE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatRelativeTime(ts: number | null): string {
  if (ts === null) return "Never sent before";
  const diffMin = Math.round((Date.now() - ts) / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "critical";
  icon?: ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 text-sm secondary-text mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-semibold ${tone === "critical" ? "error-text" : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}

function VolumeTimeline({ sentEmails }: { sentEmails: SentEmail[] }) {
  const todayStart = startOfDay(Date.now());
  const dayStarts = Array.from(
    { length: TIMELINE_DAYS },
    (_, i) => todayStart - (TIMELINE_DAYS - 1 - i) * DAY_MS,
  );
  const templates = Array.from(new Set(sentEmails.map((e) => e.template))).sort();

  const data = dayStarts.map((day) => {
    const row: Record<string, number | string> = {
      date: new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    for (const template of templates) {
      row[template] = sentEmails.filter(
        (e) => e.template === template && startOfDay(e.sentAt) === day,
      ).length;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {templates.map((template, i) => (
          <Line
            key={template}
            type="monotone"
            dataKey={template}
            stroke={TEMPLATE_COLORS[i % TEMPLATE_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EmailMonitoringTab({ sentEmails }: EmailMonitoringTabProps) {
  const [previewItem, setPreviewItem] = useState<SentEmail | null>(null);

  const now = Date.now();
  const totalSent7d = sentEmails.filter((e) => e.sentAt >= now - 7 * DAY_MS).length;
  const sentToday = sentEmails.filter((e) => startOfDay(e.sentAt) === startOfDay(now)).length;
  const uniqueRecipients7d = new Set(
    sentEmails.filter((e) => e.sentAt >= now - 7 * DAY_MS).map((e) => e.recipientId),
  ).size;

  const recipientIds = Array.from(new Set(sentEmails.map((e) => e.recipientId)));
  const frequencyWatchlist = recipientIds
    .map((recipientId) => {
      const history = sentEmails.filter((e) => e.recipientId === recipientId);
      return {
        recipientId,
        email: history[0].recipientEmail,
        sentLast24h: history.filter((e) => e.sentAt >= now - DAY_MS).length,
        sentLast3d: history.filter((e) => e.sentAt >= now - 3 * DAY_MS).length,
        sentLast7d: history.filter((e) => e.sentAt >= now - 7 * DAY_MS).length,
        sentLast30d: history.filter((e) => e.sentAt >= now - 30 * DAY_MS).length,
      };
    })
    .sort(
      (a, b) =>
        b.sentLast24h - a.sentLast24h ||
        b.sentLast3d - a.sentLast3d ||
        b.sentLast7d - a.sentLast7d ||
        b.sentLast30d - a.sentLast30d,
    );

  const flaggedRecipients = frequencyWatchlist.filter(
    (w) =>
      w.sentLast24h > WARN_24H ||
      w.sentLast3d > WARN_3D ||
      w.sentLast7d > WARN_7D ||
      w.sentLast30d > WARN_30D,
  );

  const recentSends = [...sentEmails].sort((a, b) => b.sentAt - a.sentAt);

  const previousSendFor = (item: SentEmail): number | null => {
    const priorSends = sentEmails.filter(
      (e) => e.recipientId === item.recipientId && e.sentAt < item.sentAt,
    );
    if (priorSends.length === 0) return null;
    return Math.max(...priorSends.map((e) => e.sentAt));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Email Monitoring</h2>
        <p className="text-sm secondary-text">
          Send volume and recipient frequency, last 30 days.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Sent (7d)"
          value={totalSent7d.toLocaleString()}
          icon={<Mail className="w-4 h-4" />}
        />
        <StatCard
          label="Sent today"
          value={sentToday.toLocaleString()}
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Unique recipients (7d)"
          value={uniqueRecipients7d.toLocaleString()}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Recipients over threshold"
          value={flaggedRecipients.length.toLocaleString()}
          tone={flaggedRecipients.length > 0 ? "critical" : undefined}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold header-3 mb-3">
          Send volume timeline
        </h3>
        {sentEmails.length === 0 ? (
          <p className="text-sm secondary-text">
            No sends recorded yet.
          </p>
        ) : (
          <VolumeTimeline sentEmails={sentEmails} />
        )}
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 secondary-text" />
          <h3 className="text-sm font-semibold header-3">
            Frequency watchlist
          </h3>
        </div>
        <p className="text-xs inactive-text-soft mb-3">
          Every recipient we've emailed recently, sorted with the
          most-emailed first.
        </p>
        {frequencyWatchlist.length === 0 ? (
          <p className="text-sm secondary-text">
            No sends recorded yet.
          </p>
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
                  <TableCell className="font-medium">
                    {w.email}
                  </TableCell>
                  <TableCell
                    className={
                      w.sentLast24h > WARN_24H
                        ? "font-semibold attention-text"
                        : ""
                    }
                  >
                    {w.sentLast24h}
                  </TableCell>
                  <TableCell
                    className={
                      w.sentLast3d > WARN_3D
                        ? "font-semibold attention-text"
                        : ""
                    }
                  >
                    {w.sentLast3d}
                  </TableCell>
                  <TableCell
                    className={
                      w.sentLast7d > WARN_7D
                        ? "font-semibold attention-text"
                        : ""
                    }
                  >
                    {w.sentLast7d}
                  </TableCell>
                  <TableCell
                    className={
                      w.sentLast30d > WARN_30D
                        ? "font-semibold attention-text"
                        : ""
                    }
                  >
                    {w.sentLast30d}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold header-3 mb-3">
          Sent emails
        </h3>
        {recentSends.length === 0 ? (
          <p className="text-sm secondary-text">Nothing sent yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sent</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>
                  Previous email to this recipient
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSends.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="secondary-text">
                    {formatDateTime(item.sentAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.recipientEmail}
                  </TableCell>
                  <TableCell className="secondary-text-strong">
                    {item.template}
                  </TableCell>
                  <TableCell className="secondary-text">
                    {formatRelativeTime(previousSendFor(item))}
                  </TableCell>
                  <TableCell>
                    {item.previewHtml ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewItem(item)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    ) : (
                      <span className="text-xs inactive-text-soft">
                        No preview available
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={previewItem !== null}
        onOpenChange={(open: boolean) =>
          !open && setPreviewItem(null)
        }
      >
        <DialogContent className="max-w-3xl w-[95%]">
          <DialogHeader>
            <DialogTitle>{previewItem?.previewSubject}</DialogTitle>
            <DialogDescription>
              {previewItem?.recipientEmail} &middot;{" "}
              {previewItem?.template}
            </DialogDescription>
          </DialogHeader>
          {previewItem?.previewHtml && (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                srcDoc={previewItem.previewHtml}
                title="Email Preview"
                className="w-full h-[600px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
