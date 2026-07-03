import { useEffect, useState } from "react";
import type { SentEmail } from "../../../types";
import { EmailMonitoringTab } from "./EmailMonitoringTab";
import { api } from "../../../utils/api";

export function EmailMonitoringTabContainer() {
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api.getSentEmails().then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setSentEmails(result.data.sentEmails);
      } else {
        setError(result.error ?? "Failed to load sent emails");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading sent emails...</p>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return <EmailMonitoringTab sentEmails={sentEmails} />;
}
