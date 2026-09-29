import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "../../ui/button";
import { ClusterNameReviewRoom } from "../../../types";
import { getClusterColor, getClusterDisplayName } from "../../../utils/colors";

interface ClusterNamesReviewRowProps {
  room: ClusterNameReviewRoom;
  regenerating: boolean;
  onRegenerate: (roomId: string) => void;
}

export function ClusterNamesReviewRow({ room, regenerating, onRegenerate }: ClusterNamesReviewRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="font-medium truncate">{room.topic}</p>
          <p className="text-xs text-slate-500">
            {room.voteCount.toLocaleString()} votes · {new Date(room.createdAt).toLocaleString()}
          </p>
        </div>

        {room.clusters === null ? (
          <p className="text-sm text-slate-500">No clusters yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {room.clusters.map((cluster) => {
              const colors = getClusterColor(cluster.slot);
              return (
                <div
                  key={cluster.stableId}
                  className={`rounded-md border px-2 py-1 text-sm ${colors.bg} ${colors.border}`}
                >
                  <span className={`font-medium ${colors.text}`}>
                    {getClusterDisplayName(cluster.slot, cluster.name)}
                  </span>
                  <span className="text-slate-500"> · {cluster.size}</span>
                  {cluster.previousName && (
                    <p className="text-xs text-slate-500">
                      was "{cluster.previousName}"
                      {cluster.renameReason && ` · ${cluster.renameReason}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={regenerating}
        onClick={() => onRegenerate(room.roomId)}
      >
        {regenerating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-2" />
        )}
        Re-run naming
      </Button>
    </div>
  );
}
