import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { RefreshCw, Mail } from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import type { UserSession } from "../../types";

interface EmailPreviewsProps {
  user: UserSession | null;
}

export function EmailPreviews({ user }: EmailPreviewsProps) {
  const [emailHtml, setEmailHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fetchEmailPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4/dev/email-previews`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}`,
        );
      }

      const html = await response.text();
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
  }, []);

  const sendEmail = async () => {
    if (!user?.email) {
      toast.error("No email address found for current user");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f1a393b4/dev/email-previews/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ toEmail: user.email }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();
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
        <Button
          onClick={fetchEmailPreview}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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

      {!loading && !error && emailHtml && (
        <div className="flex items-center justify-between mt-4 p-4 bg-slate-50 rounded-lg border">
          <div className="text-sm text-slate-600">
            {user?.email ? (
              <>
                Send test email to:{" "}
                <span className="font-medium">
                  {user.email}
                </span>
              </>
            ) : (
              "No email address found"
            )}
          </div>
          <Button
            onClick={sendEmail}
            variant="outline"
            size="sm"
            disabled={sending || !user?.email}
          >
            <Mail className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
      )}
    </div>
  );
}