import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api, safelyMakeApiCall } from "../utils/api";

interface NewsletterViewerProps {
  edition: number;
}

export function NewsletterViewer({ edition }: NewsletterViewerProps) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsletter = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await safelyMakeApiCall(() => api.getNewsletter(edition));
        setHtml(response?.data?.html || "<p>Newsletter content is unavailable.</p>");
      } catch (err) {
        console.error("Error fetching newsletter:", err);
        setError("Failed to load newsletter");
      } finally {
        setLoading(false);
      }
    };

    fetchNewsletter();
  }, [edition]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">{error}</p>
          <a href="/" className="text-purple-600 hover:underline">
            Go back to Heard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        margin: 0,
        padding: 0,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh"
      }}
    >
      <style>
        {`
          a {
            color: #667eea;
            text-decoration: underline;
          }
        `}
      </style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}