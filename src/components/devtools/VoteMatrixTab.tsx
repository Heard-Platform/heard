import { useState, useEffect } from "react";
import { api, safelyMakeApiCall } from "../../utils/api";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { DebateRoom, Statement, StatementMerge } from "../../types";
import { VoteMatrix } from "../room/VoteMatrix";

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export function VoteMatrixTab() {
  const [rooms, setRooms] = useState<DebateRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<DebateRoom | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [merges, setMerges] = useState<StatementMerge[]>([]);
  const [phoneVerified, setPhoneVerified] = useState<Record<string, boolean>>({});
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [search, setSearch] = useState("");

  const loadRooms = async () => {
    setLoadingRooms(true);
    const response = await safelyMakeApiCall(() => api.getAllPosts());
    if (response?.success && response.data?.posts) {
      setRooms(response.data.posts);
    }
    setLoadingRooms(false);
  };

  const openMatrix = async (room: DebateRoom) => {
    setSelectedRoom(room);
    setStatements([]);
    setMerges([]);
    setPhoneVerified({});
    setLoadingMatrix(true);
    const response = await safelyMakeApiCall(() => api.getVoteMatrix(room.id));
    if (response?.success && response.data) {
      setStatements(response.data.statements);
      setMerges(response.data.merges);
      setPhoneVerified(response.data.phoneVerified ?? {});
    }
    setLoadingMatrix(false);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const filteredRooms = rooms.filter(
    (r) =>
      r.topic.toLowerCase().includes(search.toLowerCase()) ||
      r.subHeard?.toLowerCase().includes(search.toLowerCase())
  );

  const totalVotesLoaded = statements.reduce(
    (sum, s) => sum + s.agrees + s.superAgrees + s.disagrees + s.passes,
    0
  );

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-700">
            All Rooms ({rooms.length})
          </h2>
          <Button onClick={loadRooms} variant="outline" size="sm">
            <RefreshCw className="w-3 h-3 mr-2" />
            Refresh
          </Button>
        </div>
        <input
          type="text"
          placeholder="Search rooms…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {loadingRooms ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : (
          <div className="space-y-2">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="border rounded-lg p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 line-clamp-2 leading-snug text-sm">
                    {room.topic}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex gap-2">
                    <span>{formatDate(room.createdAt)}</span>
                    <span>·</span>
                    <span>{room.participants.length} participants</span>
                    {room.subHeard && (
                      <>
                        <span>·</span>
                        <span>r/{room.subHeard}</span>
                      </>
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openMatrix(room)}
                  className="shrink-0"
                >
                  View Matrix
                </Button>
              </div>
            ))}
            {filteredRooms.length === 0 && (
              <p className="text-slate-400 text-sm py-4 text-center">No rooms found.</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!selectedRoom} onOpenChange={(open: boolean) => !open && setSelectedRoom(null)}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] flex flex-col gap-2 overflow-hidden">
          <DialogTitle className="line-clamp-1 pr-8 shrink-0">
            {selectedRoom?.topic}
          </DialogTitle>
          {loadingMatrix ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Loading matrix…
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 shrink-0">
                {statements.length} statements · {selectedRoom?.participants.length} participants · {totalVotesLoaded} votes
                {merges.length > 0 && ` · ${merges.length} merges`}
              </p>
              <div className="flex-1 overflow-hidden min-h-0">
                <VoteMatrix
                  statements={statements}
                  merges={merges}
                  phoneVerified={phoneVerified}
                  tableWrapperClassName="h-full"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
