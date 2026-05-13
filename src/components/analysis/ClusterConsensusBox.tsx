import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "../ui/badge";
import { StatementVotes } from "../../types";
import { StatementVotesTableHead, clusterLabel } from "./StatementVotesTableHead";
import { StatementVotesTableRow } from "./StatementVotesTableRow";
import { getClusterColor } from "../../utils/colors";

const VISIBLE_STATEMENTS = 3;

interface ClusterConsensusBoxProps {
  clusterIndex: number;
  clusterSize: number;
  clusterSizes: number[];
  totalParticipants: number;
  statements: StatementVotes[];
  showNumbers: boolean;
}

export function ClusterConsensusBox({
  clusterIndex,
  clusterSize,
  clusterSizes,
  totalParticipants,
  statements,
  showNumbers,
}: ClusterConsensusBoxProps) {
  const colors = getClusterColor(clusterIndex);
  const [expanded, setExpanded] = useState(false);
  const visibleStatements = expanded ? statements : statements.slice(0, VISIBLE_STATEMENTS);
  const extraCount = Math.max(0, statements.length - VISIBLE_STATEMENTS);

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
              showNumbers={showNumbers}
              highlightClusterIndex={clusterIndex}
            />
            <tbody>
              {visibleStatements.map((statement) => (
                <StatementVotesTableRow
                  key={statement.id}
                  statement={statement}
                  totalParticipants={totalParticipants}
                  showNumbers={showNumbers}
                  clusterIndex={clusterIndex}
                />
              ))}
            </tbody>
          </table>
          {extraCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  See less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  See more
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No consensus statements found for this cluster
        </p>
      )}
    </div>
  );
}
