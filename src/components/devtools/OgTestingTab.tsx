import { useState, useEffect } from "react";
import { api, safelyMakeApiCall } from "../../utils/api";
import { devApi } from "../../utils/dev-api";
import type { DebateRoom } from "../../types";

export function OgTestingTab() {
  const [rooms, setRooms] = useState<DebateRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await safelyMakeApiCall(() => api.getAllPosts());
      if (response?.success && response.data?.posts) {
        setRooms(response.data.posts);
      }
      setLoadingRooms(false);
    };
    load();
  }, []);

  const handleRoomChange = async (roomId: string) => {
    setSelectedRoomId(roomId);
    setHtml(null);
    if (!roomId) return;
    setLoading(true);
    const result = await devApi.getRoomOgHtml(roomId);
    setHtml(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium mb-1">Link Preview Testing</h2>
        <p className="text-slate-500 text-sm mb-4">
          Renders the OG HTML returned by the Supabase endpoint — what social crawlers see when a room link is shared.
        </p>
        <select
          value={selectedRoomId}
          onChange={(e) => handleRoomChange(e.target.value)}
          disabled={loadingRooms}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">
            {loadingRooms ? "Loading rooms…" : "Select a room…"}
          </option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.emoji ? `${room.emoji} ` : ""}{room.topic}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="text-slate-500 text-sm">Loading preview…</p>
      )}

      {html && !loading && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Preview</p>
          <iframe
            srcDoc={html}
            sandbox="allow-same-origin"
            className="w-full border border-slate-200 rounded-lg"
            style={{ height: 340 }}
            title="OG preview"
          />
          <details>
            <summary className="text-sm text-slate-500 cursor-pointer select-none">
              View raw HTML
            </summary>
            <pre className="mt-2 p-4 bg-slate-50 rounded-lg text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap border border-slate-200">
              {html}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
