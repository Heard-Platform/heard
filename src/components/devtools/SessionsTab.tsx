import { useState, useEffect, CSSProperties, ChangeEvent } from "react";
import moment from "moment";
import { RefreshCw } from "lucide-react";
import { devApi } from "../../utils/dev-api";
import { timeAgoShort } from "../../utils/time";

interface SessionSummary {
  sessionId: string;
  userId: string;
  userLabel: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number;
  eventCount: number;
  eventTypes: string[];
  isActive: boolean;
}

interface SessionsResponse {
  sessions: SessionSummary[];
  fetchedAt: number;
}

const styles: Record<string, CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: 24 },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: 500, margin: 0, color: "#0f172a" },
  controlsRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  dateLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  dateInput: {
    fontSize: 14,
    color: "#334155",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: "5px 8px",
  },
  refreshButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    fontSize: 14,
    fontWeight: 500,
    color: "#334155",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    cursor: "pointer",
  },
  description: { fontSize: 12, color: "#94a3b8", margin: 0 },
  card: {
    padding: 16,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#334155",
    marginTop: 0,
    marginBottom: 16,
  },
  summaryRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
    fontSize: 14,
  },
  summaryLabel: { color: "#64748b" },
  summaryValue: { fontFamily: "monospace", color: "#334155" },
  emptyText: { fontSize: 14, color: "#94a3b8", margin: 0 },
  tableWrap: { maxHeight: "32rem", overflowY: "auto" },
  table: { width: "100%", fontSize: 14, borderCollapse: "collapse" },
  theadRow: {
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left",
    color: "#64748b",
  },
  th: { padding: "4px 8px 4px 0", fontWeight: 500 },
  thRight: { padding: "4px 0", fontWeight: 500, textAlign: "right" },
  tr: { borderBottom: "1px solid #e2e8f0" },
  td: {
    padding: "4px 8px 4px 0",
    fontFamily: "monospace",
    fontSize: 12,
    color: "#475569",
    wordBreak: "break-all",
  },
  tdStatus: { padding: "4px 8px 4px 0", color: "#334155" },
  statusActive: { color: "#16a34a" },
  tdEventTypes: {
    padding: "4px 8px 4px 0",
    fontSize: 12,
    color: "#64748b",
    wordBreak: "break-all",
  },
  tdRight: {
    padding: "4px 0",
    textAlign: "right",
    fontSize: 12,
    color: "#94a3b8",
    whiteSpace: "nowrap",
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 0",
    color: "#475569",
    fontWeight: 600,
  },
};

const formatDuration = (ms: number): string => {
  const duration = moment.duration(ms);
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const seconds = duration.seconds();
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export function SessionsTab() {
  const [data, setData] = useState<SessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sinceDate, setSinceDate] = useState("");

  const load = async (dateStr: string) => {
    setLoading(true);
    try {
      const sinceTs = dateStr ? new Date(dateStr).getTime() : undefined;
      const response = await devApi.getSessions(sinceTs);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(sinceDate);
  }, []);

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSinceDate(value);
    load(value);
  };

  if (loading) {
    return <div style={styles.loadingWrap}>Loading sessions...</div>;
  }

  if (!data) {
    return <div style={styles.loadingWrap}>Failed to load sessions.</div>;
  }

  const activeCount = data.sessions.filter((s) => s.isActive).length;
  const completedSessions = data.sessions.filter((s) => !s.isActive);
  const avgDurationMs =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + s.durationMs, 0) /
        completedSessions.length
      : 0;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>Sessions</h2>
        <div style={styles.controlsRow}>
          <span style={styles.dateLabel}>Since</span>
          <input
            type="date"
            value={sinceDate}
            onChange={handleDateChange}
            style={styles.dateInput}
          />
          <button onClick={() => load(sinceDate)} style={styles.refreshButton}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <p style={styles.description}>
        Sessions derived from user_events over the last 24 hours (or since
        the selected date), split on 15 minutes of inactivity. Events
        without a userId (pre-auth/anonymous) are excluded since they can't
        be grouped reliably, developer accounts are excluded, and
        single-event sessions are hidden as noise.
      </p>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Summary</h3>
        <div style={styles.summaryRow}>
          <div>
            <span style={styles.summaryLabel}>Active now: </span>
            <span style={styles.summaryValue}>{activeCount}</span>
          </div>
          <div>
            <span style={styles.summaryLabel}>Completed: </span>
            <span style={styles.summaryValue}>
              {completedSessions.length}
            </span>
          </div>
          <div>
            <span style={styles.summaryLabel}>Avg duration: </span>
            <span style={styles.summaryValue}>
              {formatDuration(avgDurationMs)}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          Sessions ({data.sessions.length.toLocaleString()})
        </h3>
        {data.sessions.length === 0 ? (
          <p style={styles.emptyText}>No sessions in this window.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Events</th>
                  <th style={styles.th}>Event Types</th>
                  <th style={styles.thRight}>Started</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((s) => (
                  <tr key={s.sessionId} style={styles.tr}>
                    <td style={styles.td}>{s.userLabel}</td>
                    <td style={styles.tdStatus}>
                      {s.isActive ? (
                        <span style={styles.statusActive}>Active</span>
                      ) : (
                        "Completed"
                      )}
                    </td>
                    <td style={styles.td}>{formatDuration(s.durationMs)}</td>
                    <td style={styles.td}>{s.eventCount}</td>
                    <td style={styles.tdEventTypes}>
                      {s.eventTypes.join(", ")}
                    </td>
                    <td style={styles.tdRight}>
                      {timeAgoShort(s.startedAt)} ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
