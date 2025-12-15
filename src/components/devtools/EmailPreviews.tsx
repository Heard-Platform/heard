import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { RefreshCw, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../utils/api";
import type { UserSession } from "../../types";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface EmailPreviewsProps {
  user: UserSession;
}

interface UserListCollapsibleProps {
  title: string;
  users: Array<{ email: string; nickname: string; id: string }>;
  isExpanded: boolean;
  onToggle: () => void;
}

function UserListCollapsible({ title, users, isExpanded, onToggle }: UserListCollapsibleProps) {
  if (users.length === 0) return null;

  return (
    <div className="mt-4 border-t border-blue-200 pt-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-blue-900 hover:text-blue-700 transition-colors"
      >
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        <span className="font-medium">
          {title} ({users.length})
        </span>
      </button>
      {isExpanded && (
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded px-3 py-2 text-sm border border-blue-100"
            >
              <div className="font-medium text-blue-900">{u.nickname}</div>
              <div className="text-blue-700">{u.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmailPreviews({ user }: EmailPreviewsProps) {
  const [emailHtml, setEmailHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [digestType, setDigestType] = useState<string>("weekly_digest");
  const [countData, setCountData] = useState<{
    eligibleCount: number;
    totalCount: number;
  } | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState<Array<{ email: string; nickname: string; id: string }>>([]);
  const [consideredUsers, setConsideredUsers] = useState<Array<{ email: string; nickname: string; id: string }>>([]);
  const [showEligibleUsers, setShowEligibleUsers] = useState(false);
  const [showConsideredUsers, setShowConsideredUsers] = useState(false);

  const fetchEmailPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const html = await api.getEmailPreview(
        useMockData ? undefined : user.id,
        digestType,
      );
      setEmailHtml(html);
    } catch (err) {
      console.error("Error fetching email preview:", err);
      setError(
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailPreview();
  }, [useMockData, digestType]);

  const sendEmail = async () => {
    setSending(true);
    setError(null);

    try {
      const result = await api.sendTestEmail(user.id, useMockData, digestType);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }
      
      toast.success(`Email sent to ${user.email}!`);
    } catch (err) {
      console.error("Error sending email:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      toast.error(`Failed to send email: ${errorMsg}`);
    } finally {
      setSending(false);
    }
  };

  const fetchCountData = async () => {
    if (useMockData || digestType === "admin_daily_digest") {
      setCountData(null);
      setEligibleUsers([]);
      setConsideredUsers([]);
      return;
    }

    setLoadingCount(true);

    try {
      const result = await api.getEmailDigestCount(digestType);
      
      if (result.success && result.data) {
        setCountData({
          eligibleCount: result.data.eligibleCount,
          totalCount: result.data.totalCount,
        });
        setEligibleUsers(result.data.eligibleUsers || []);
        setConsideredUsers(result.data.consideredUsers || []);
      } else {
        throw new Error(result.error || "Failed to fetch count");
      }
    } catch (err) {
      console.error("Error fetching count data:", err);
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    fetchCountData();
  }, [useMockData, digestType]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3>Email Previews</h3>
        <div className="flex items-center gap-3">
          {digestType !== "admin_daily_digest" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">
                Mock Data
              </label>
              <button
                onClick={() => setUseMockData(!useMockData)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useMockData ? "bg-purple-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useMockData
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">
              Digest Type
            </label>
            <select
              value={digestType}
              onChange={(e) => setDigestType(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-sm"
            >
              <option value="weekly_digest">Weekly Digest</option>
              <option value="first_day_digest">First Day Digest</option>
              <option value="admin_daily_digest">Admin Daily Digest</option>
            </select>
          </div>
          <Button
            onClick={fetchEmailPreview}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {user.email && (
            <Button
              onClick={sendEmail}
              variant="outline"
              size="sm"
              disabled={sending}
            >
              <Mail className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Send Test Email"}
            </Button>
          )}
        </div>
      </div>

      {!useMockData && countData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-blue-900">
                <span className="font-semibold">{countData.eligibleCount} of {countData.totalCount}</span> users would receive an email for this timeframe
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {countData.eligibleCount === 0 && "No users have activity in this period"}
                {countData.eligibleCount > 0 && `${Math.round((countData.eligibleCount / countData.totalCount) * 100)}% of users have activity`}
              </p>
            </div>
            {loadingCount && (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>

          {eligibleUsers.length > 0 && (
            <UserListCollapsible
              title="Users who would receive email"
              users={eligibleUsers}
              isExpanded={showEligibleUsers}
              onToggle={() => setShowEligibleUsers(!showEligibleUsers)}
            />
          )}

          {consideredUsers.length > 0 && (
            <UserListCollapsible
              title={digestType === "first_day_digest" ? "All users considered (created in last day)" : "All users considered (active in last week)"}
              users={consideredUsers}
              isExpanded={showConsideredUsers}
              onToggle={() => setShowConsideredUsers(!showConsideredUsers)}
            />
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <p className="text-slate-600">
            Loading email preview...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {!loading && !error && emailHtml && (
        <div className="border rounded-lg overflow-hidden">
          <iframe
            srcDoc={emailHtml}
            title="Email Preview"
            className="w-full h-[800px] border-0"
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}