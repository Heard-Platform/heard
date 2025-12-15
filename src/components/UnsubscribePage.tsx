import { useEffect, useState } from "react";
import { api } from "../utils/api";

interface UnsubscribePageProps_ {
  status: "loading" | "success" | "error";
  errorMessage?: string;
}

export function UnsubscribePage_({ status, errorMessage = "" }: UnsubscribePageProps_) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600 text-lg">Processing your request...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl mb-4 text-gray-900">You're unsubscribed</h1>
            <p className="text-gray-600 text-lg mb-8">
              You won't receive any more email digests from Heard.
            </p>
            <a
              href="/"
              className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
            >
              Back to Heard
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl mb-4 text-gray-900">Something went wrong</h1>
            <p className="text-gray-600 text-lg mb-8">{errorMessage}</p>
            <a
              href="/"
              className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
            >
              Back to Heard
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export function UnsubscribePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const userId = searchParams.get("userId");

        if (!userId) {
          setStatus("error");
          setErrorMessage("Invalid unsubscribe link");
          return;
        }

        const result = await api.unsubscribe(userId);

        if (!result.success) {
          throw new Error(result.error || "Failed to unsubscribe");
        }

        setStatus("success");
      } catch (error) {
        console.error("Error unsubscribing:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
      }
    };

    unsubscribe();
  }, []);

  return <UnsubscribePage_ status={status} errorMessage={errorMessage} />;
}