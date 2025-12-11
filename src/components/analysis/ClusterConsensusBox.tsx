import { Badge } from "../ui/badge";
import { ClusterStatement } from "../../types";

interface ClusterConsensusBoxProps {
  clusterNumber: number;
  clusterSize: number;
  statements: ClusterStatement[];
}

const clusterColors = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", badge: "bg-blue-100" },
  { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", badge: "bg-green-100" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", badge: "bg-purple-100" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", badge: "bg-orange-100" },
];

export function ClusterConsensusBox({ 
  clusterNumber, 
  clusterSize, 
  statements 
}: ClusterConsensusBoxProps) {
  const colors = clusterColors[clusterNumber % clusterColors.length];

  return (
    <div className={`border ${colors.border} rounded-lg p-4 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium ${colors.text}`}>
            Cluster {clusterNumber}
          </h3>
          <Badge variant="outline" className={colors.badge}>
            {clusterSize} users
          </Badge>
        </div>
      </div>

      {statements.length > 0 ? (
        <div className="space-y-3">
          {statements.map((statement, idx) => (
            <div key={statement.id} className="bg-white rounded-lg p-3 border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      #{idx + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {statement.consensusScore.toFixed(0)}% agreement
                    </span>
                  </div>
                  <p className="text-sm">{statement.text}</p>
                </div>
                <div className="flex flex-col items-end text-xs text-muted-foreground">
                  <span>{statement.agreeVotes}/{statement.totalVotes}</span>
                  <span>votes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No consensus statements found for this cluster
        </p>
      )}
    </div>
  );
}