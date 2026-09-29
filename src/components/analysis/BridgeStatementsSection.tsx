import { ArrowLeftRight } from "lucide-react";
import { Badge } from "../ui/badge";
import { ClusterColumn, StatementVotes } from "../../types";
import { getTopBridgingStatements } from "../../utils/bridging-utils";
import { getClusterColor, getClusterDisplayName } from "../../utils/colors";
import { StatementVotesTableHead } from "./StatementVotesTableHead";
import { StatementVotesTableRow } from "./StatementVotesTableRow";

interface BridgeStatementsSectionProps {
  statements: StatementVotes[];
  totalParticipants: number;
  clusterColumns: ClusterColumn[];
  showNumbers: boolean;
}

export function BridgeStatementsSection({
  statements,
  totalParticipants,
  clusterColumns,
  showNumbers,
}: BridgeStatementsSectionProps) {
  const bridges = getTopBridgingStatements(statements);

  if (bridges.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="font-medium flex items-center gap-2">
        <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
        Bridging Statements
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        Statements where otherwise-opposed clusters of people find common ground
      </p>
      <div className="bg-white rounded-lg border p-3">
        <table className="w-full text-sm">
          <StatementVotesTableHead
            totalParticipants={totalParticipants}
            clusterColumns={clusterColumns}
            showNumbers={showNumbers}
          />
          <tbody>
            {bridges.map(({ statement, clusterAId, clusterBId }) => {
              const clusterA = clusterColumns[clusterAId];
              const clusterB = clusterColumns[clusterBId];
              const colorsA = getClusterColor(clusterA.slot);
              const colorsB = getClusterColor(clusterB.slot);
              return (
                <StatementVotesTableRow
                  key={statement.id}
                  statement={statement}
                  totalParticipants={totalParticipants}
                  showNumbers={showNumbers}
                  highlightClusterIndices={[clusterAId, clusterBId]}
                  caption={
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="outline" className={`${colorsA.badge} ${colorsA.text}`}>
                        {getClusterDisplayName(clusterA.slot, clusterA.name)}
                      </Badge>
                      <ArrowLeftRight className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="outline" className={`${colorsB.badge} ${colorsB.text}`}>
                        {getClusterDisplayName(clusterB.slot, clusterB.name)}
                      </Badge>
                    </div>
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
