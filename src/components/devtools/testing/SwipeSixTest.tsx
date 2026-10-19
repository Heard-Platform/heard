import { useState } from "react";
import { devApi, type SwipeSixResponse } from "../../../utils/dev-api";
import { Button } from "../../ui/button";

export function SwipeSixTest() {
  const [result, setResult] = useState<SwipeSixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    const response = await devApi.getSwipeSix();
    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setResult(null);
      setError(response.error ?? "Failed to build swipe six");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Swipe Six Feed Test</h2>
      <p className="text-slate-500 text-sm mb-4">
        Builds your daily six from recent posts: 2 DC, 1 fun, 2 DC, 1 fun. Skips statements you've voted on.
      </p>
      <Button onClick={generate} disabled={loading}>
        {loading ? "Building…" : result ? "Regenerate" : "Generate"}
      </Button>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

      {result && (
        <ol className="mt-4 space-y-2">
          {result.items.map((item, i) => (
            <li key={item.statement.id} className="border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">
                {i + 1}. {item.room.subHeard} · {item.room.emoji ? `${item.room.emoji} ` : ""}{item.room.topic} · posted {new Date(item.room.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm">{item.statement.text}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
