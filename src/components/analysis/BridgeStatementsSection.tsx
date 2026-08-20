import { ArrowLeftRight } from "lucide-react";
import { Badge } from "../ui/badge";
import { StatementVotes } from "../../types";
import { getTopBridgingStatements } from "../../utils/bridging-utils";
import { getClusterColor } from "../../utils/colors";
import { StatementVotesTableHead, clusterLabel } from "./StatementVotesTableHead";
import { StatementVotesTableRow } from "./StatementVotesTableRow";

interface BridgeStatementsSectionProps {
  statements: StatementVotes[];
  totalParticipants: number;
  clusterSizes: number[];
  showNumbers: boolean;
}

export function BridgeStatementsSection({
  statements,
  totalParticipants,
  clusterSizes,
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
            clusterSizes={clusterSizes}
            showNumbers={showNumbers}
          />
          <tbody>
            {bridges.map(({ statement, clusterAId, clusterBId }) => {
              const colorsA = getClusterColor(clusterAId);
              const colorsB = getClusterColor(clusterBId);
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
                        Cluster {clusterLabel(clusterAId)}
                      </Badge>
                      <ArrowLeftRight className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="outline" className={`${colorsB.badge} ${colorsB.text}`}>
                        Cluster {clusterLabel(clusterBId)}
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
