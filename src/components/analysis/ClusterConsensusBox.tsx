import { Badge } from "../ui/badge";
import { StatementVotes } from "../../types";
import { StatementVotesTableHead, clusterLabel } from "./StatementVotesTableHead";
import { StatementVotesTableRow } from "./StatementVotesTableRow";
import { getClusterColor } from "../../utils/colors";

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
  const colors = getClusterColor(clusterIndex);

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
              highlightClusterIndex={clusterIndex}
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
