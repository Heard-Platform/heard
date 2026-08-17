import { useState, useEffect, type CSSProperties } from "react";
import { RefreshCw, Eye, Send, Mail } from "lucide-react";
import { api, safelyMakeApiCall } from "../../utils/api";
import type { DebateRoom, UserSession } from "../../types";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface NotifyPreview {
  subject: string;
  html: string;
  newStatementCount: number;
  participantCount: number;
  recipientCount: number;
}

interface SendResult {
  dryRun: boolean;
  sent: number;
  failed: number;
  recipientCount: number;
  message: string;
  errors: string[];
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
};

const controlsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const selectStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  padding: "4px 8px",
  fontSize: "14px",
  maxWidth: "320px",
  background: "#ffffff",
  color: "#0f172a",
};

const buttonBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  padding: "6px 12px",
  fontSize: "14px",
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
};

const buttonDisabledStyle: CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const infoBoxStyle: CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "16px",
};

const infoTextStyle: CSSProperties = {
  margin: 0,
  color: "#1e3a8a",
  fontSize: "14px",
};

const boldStyle: CSSProperties = {
  fontWeight: 600,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const resultBoxStyle = (dryRun: boolean): CSSProperties => ({
  borderRadius: "8px",
  padding: "16px",
  border: `1px solid ${dryRun ? "#fde68a" : "#bbf7d0"}`,
  background: dryRun ? "#fffbeb" : "#f0fdf4",
});

const resultTextStyle = (dryRun: boolean): CSSProperties => ({
  margin: 0,
  color: dryRun ? "#92400e" : "#166534",
  fontSize: "14px",
});

const errorListStyle: CSSProperties = {
  margin: "8px 0 0 0",
  paddingLeft: "20px",
  fontSize: "13px",
  color: "#b91c1c",
};

const errorBoxStyle: CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "16px",
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "#991b1b",
  fontSize: "14px",
};

const loadingRowStyle: CSSProperties = {
  textAlign: "center",
  padding: "48px 0",
};

const loadingTextStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "14px",
};

const previewContainerStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  overflow: "hidden",
};

const previewHeaderStyle: CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: "12px 16px",
};

const previewLabelStyle: CSSProperties = {
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#64748b",
};

const previewSubjectStyle: CSSProperties = {
  fontWeight: 500,
  color: "#0f172a",
};

const iframeStyle: CSSProperties = {
  width: "100%",
  height: "800px",
  border: "none",
};

const iconStyle: CSSProperties = { flexShrink: 0 };

interface NotificationSystemTabProps {
  user: UserSession;
}

export function NotificationSystemTab({ user }: NotificationSystemTabProps) {
  const [rooms, setRooms] = useState<DebateRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [preview, setPreview] = useState<NotifyPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);

  const loadRooms = async () => {
    setLoadingRooms(true);
    const response = await safelyMakeApiCall(() => api.getAllPosts());
    if (response?.success && response.data?.posts) {
      const sorted = [...response.data.posts].sort(
        (a, b) => b.createdAt - a.createdAt,
      );
      setRooms(sorted);
      setSelectedRoomId((current) => current || sorted[0]?.id || "");
    }
    setLoadingRooms(false);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const loadPreview = async (roomId: string) => {
    if (!roomId) {
      setPreview(null);
      return;
    }
    setLoadingPreview(true);
    setError(null);
    setLastResult(null);
    const response = await safelyMakeApiCall(() =>
      api.getNotifyRoomPreview(roomId),
    );
    if (response?.success && response.data) {
      setPreview(response.data);
    } else {
      setPreview(null);
      setError("Failed to load preview");
    }
    setLoadingPreview(false);
  };

  useEffect(() => {
    loadPreview(selectedRoomId);
  }, [selectedRoomId]);

  const runDryRun = async () => {
    if (!selectedRoomId) return;
    setRunning(true);
    setError(null);
    const response = await safelyMakeApiCall(() =>
      api.sendNotifyRoomEmail(selectedRoomId, true),
    );
    if (response?.success && response.data) {
      setLastResult(response.data);
      toast.success(response.data.message);
    } else {
      setError("Dry run failed");
      toast.error("Dry run failed");
    }
    setRunning(false);
  };

  const runSendToSelf = async () => {
    if (!selectedRoomId) return;
    setSendingTest(true);
    setError(null);
    const response = await safelyMakeApiCall(() =>
      api.sendNotifyRoomTestEmail(selectedRoomId),
    );
    if (response?.success && response.data) {
      toast.success(response.data.message);
    } else {
      setError("Failed to send test email");
      toast.error("Failed to send test email");
    }
    setSendingTest(false);
  };

  const runSend = async () => {
    if (!selectedRoomId || !preview) return;
    const confirmed = window.confirm(
      `Send "${preview.subject}" to ${preview.recipientCount} recipient(s)? This cannot be undone.`,
    );
    if (!confirmed) return;

    setRunning(true);
    setError(null);
    const response = await safelyMakeApiCall(() =>
      api.sendNotifyRoomEmail(selectedRoomId, false),
    );
    if (response?.success && response.data) {
      setLastResult(response.data);
      toast.success(response.data.message);
    } else {
      setError("Send failed");
      toast.error("Send failed");
    }
    setRunning(false);
  };

  const refreshDisabled = loadingRooms;
  const dryRunDisabled = running || !selectedRoomId;
  const sendDisabled = running || !selectedRoomId || !preview?.recipientCount;
  const sendTestDisabled = sendingTest || !selectedRoomId;

  return (
    <div style={containerStyle}>
      <div style={headerRowStyle}>
        <h3 style={headingStyle}>Notification System</h3>
        <div style={controlsRowStyle}>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={selectStyle}
            disabled={loadingRooms || rooms.length === 0}
          >
            {rooms.length === 0 && <option value="">No rooms</option>}
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.topic}
              </option>
            ))}
          </select>
          <button
            onClick={loadRooms}
            disabled={refreshDisabled}
            style={{
              ...buttonBaseStyle,
              ...(refreshDisabled ? buttonDisabledStyle : {}),
            }}
          >
            <RefreshCw size={14} style={iconStyle} />
            Refresh Rooms
          </button>
        </div>
      </div>

      {preview && (
        <div style={infoBoxStyle}>
          <p style={infoTextStyle}>
            You have <span style={boldStyle}>{preview.newStatementCount}</span>{" "}
            new statement{preview.newStatementCount === 1 ? "" : "s"} to vote
            on in this room ·{" "}
            <span style={boldStyle}>{preview.recipientCount}</span> of{" "}
            {preview.participantCount} participant
            {preview.participantCount === 1 ? "" : "s"} have new statements
            and would receive this email
          </p>
        </div>
      )}

      <div style={buttonRowStyle}>
        <button
          onClick={runDryRun}
          disabled={dryRunDisabled}
          style={{
            ...buttonBaseStyle,
            ...(dryRunDisabled ? buttonDisabledStyle : {}),
          }}
        >
          <Eye size={14} style={iconStyle} />
          {running ? "Running..." : "Dry Run"}
        </button>
        <button
          onClick={runSend}
          disabled={sendDisabled}
          style={{
            ...buttonBaseStyle,
            ...(sendDisabled ? buttonDisabledStyle : {}),
          }}
        >
          <Send size={14} style={iconStyle} />
          {running ? "Sending..." : "Send Now"}
        </button>
        <button
          onClick={runSendToSelf}
          disabled={sendTestDisabled}
          style={{
            ...buttonBaseStyle,
            ...(sendTestDisabled ? buttonDisabledStyle : {}),
          }}
        >
          <Mail size={14} style={iconStyle} />
          {sendingTest ? "Sending..." : `Send to Myself (${user.email})`}
        </button>
      </div>

      {lastResult && (
        <div style={resultBoxStyle(lastResult.dryRun)}>
          <p style={resultTextStyle(lastResult.dryRun)}>
            {lastResult.message}
          </p>
          {lastResult.errors.length > 0 && (
            <ul style={errorListStyle}>
              {lastResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div style={errorBoxStyle}>
          <p style={errorTextStyle}>Error: {error}</p>
        </div>
      )}

      {loadingPreview && (
        <div style={loadingRowStyle}>
          <p style={loadingTextStyle}>Loading email preview...</p>
        </div>
      )}

      {!loadingPreview && preview && (
        <div style={previewContainerStyle}>
          <div style={previewHeaderStyle}>
            <div style={previewLabelStyle}>Subject</div>
            <div style={previewSubjectStyle}>{preview.subject}</div>
          </div>
          <iframe
            srcDoc={preview.html}
            title="Email Preview"
            style={iframeStyle}
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}
