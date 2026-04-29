import { Badge } from "../ui/badge";
import { StatementVotes } from "../../types";
import { StatementVotesTableHead, clusterLabel } from "./StatementVotesTableHead";
import { StatementVotesTableRow } from "./StatementVotesTableRow";

const clusterColors = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", badge: "bg-blue-100" },
  { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", badge: "bg-green-100" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", badge: "bg-purple-100" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", badge: "bg-orange-100" },
];

interface ClusterConsensusBoxProps {
  clusterIndex: number;
  clusterSize: number;
  clusterSizes: number[];
  totalParticipants: number;
  statements: StatementVotes[];
}

export function ClusterConsensusBox({
  clusterIndex,
  clusterSize,
  clusterSizes,
  totalParticipants,
  statements,
}: ClusterConsensusBoxProps) {
  const colors = clusterColors[(clusterIndex + 1) % clusterColors.length];

  return (
    <div className={`border ${colors.border} rounded-lg p-4 ${colors.bg}`}>
      <div className="heard-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium ${colors.text}`}>
            Cluster {clusterLabel(clusterIndex)}
          </h3>
          <Badge variant="outline" className={colors.badge}>
            {clusterSize} users
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Distinguishing statements of this cluster
      </p>

      {statements.length > 0 ? (
        <div className="bg-white rounded-lg border p-3">
          <table className="w-full text-sm">
            <StatementVotesTableHead
              totalParticipants={totalParticipants}
              clusterSizes={clusterSizes}
            />
            <tbody>
              {statements.map((statement) => (
                <StatementVotesTableRow
                  key={statement.id}
                  statement={statement}
                  totalParticipants={totalParticipants}
                  clusterIndex={clusterIndex}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No consensus statements found for this cluster
        </p>
      )}
    </div>
  );
}
