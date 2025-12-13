import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { RefreshCw, Mail } from "lucide-react";
import { api } from "../../utils/api";
import type { UserSession } from "../../types";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface EmailPreviewsProps {
  user: UserSession;
}

export function EmailPreviews({ user }: EmailPreviewsProps) {
  const [emailHtml, setEmailHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [useMockData, setUseMockData] = useState(true);

  const fetchEmailPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const html = await api.getEmailPreview(useMockData ? undefined : user.id);
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
  }, [useMockData]);

  const sendEmail = async () => {
    setSending(true);
    setError(null);

    try {
      const result = await api.sendTestEmail(user.id, useMockData);
      
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3>Email Previews</h3>
        <div className="flex items-center gap-3">
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