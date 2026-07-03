import { useState } from "react";
import { AlertTriangle, Calendar, Mail, Users } from "lucide-react";
import type { SentEmail } from "../../../types";
import { StatCard } from "./StatCard";
import { VolumeTimeline } from "./VolumeTimeline";
import { FrequencyWatchlist } from "./FrequencyWatchlist";
import { SentEmailsTable } from "./SentEmailsTable";
import { EmailPreviewDialog } from "./EmailPreviewDialog";
import { buildFrequencyWatchlist, isOverThreshold, startOfDay, DAY_MS } from "./utils";

interface EmailMonitoringTabProps {
  sentEmails: SentEmail[];
}

export function EmailMonitoringTab({ sentEmails }: EmailMonitoringTabProps) {
  const [previewItem, setPreviewItem] = useState<SentEmail | null>(null);

  const now = Date.now();
  const totalSent7d = sentEmails.filter((e) => e.sentAt >= now - 7 * DAY_MS).length;
  const sentToday = sentEmails.filter((e) => startOfDay(e.sentAt) === startOfDay(now)).length;
  const uniqueRecipients7d = new Set(
    sentEmails.filter((e) => e.sentAt >= now - 7 * DAY_MS).map((e) => e.recipientId),
  ).size;
  const flaggedRecipients = buildFrequencyWatchlist(sentEmails).filter(isOverThreshold);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Email Monitoring</h2>
        <p className="text-sm secondary-text">
          Send volume and recipient frequency, last 30 days.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Sent (7d)" value={totalSent7d.toLocaleString()} icon={<Mail className="w-4 h-4" />} />
        <StatCard label="Sent today" value={sentToday.toLocaleString()} icon={<Calendar className="w-4 h-4" />} />
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

      <VolumeTimeline sentEmails={sentEmails} />
      <FrequencyWatchlist sentEmails={sentEmails} />
      <SentEmailsTable sentEmails={sentEmails} onPreview={setPreviewItem} />
      <EmailPreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
