import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { X, RefreshCw } from "lucide-react";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

interface EmailPreviewsProps {}

export function EmailPreviews({}: EmailPreviewsProps) {
  const [emailHtml, setEmailHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      setEmailHtml(html);
    } catch (err) {
      console.error("Error fetching email preview:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailPreview();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3>Email Previews</h3>
        <Button onClick={fetchEmailPreview} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading email preview...</p>
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
