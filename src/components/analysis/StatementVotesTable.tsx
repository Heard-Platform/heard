import { useState } from "react";
import { Card } from "../ui/card";
import { List } from "lucide-react";
import { StatementVotes } from "../../types";
import { StatementVotesTableHead, SortColumn, SortDir } from "./StatementVotesTableHead";
import { StatementVotesTableRow } from "./StatementVotesTableRow";

interface StatementVotesTableProps {
  statements: StatementVotes[];
  totalParticipants: number;
  clusterSizes: number[];
}

export function StatementVotesTable({ statements, totalParticipants, clusterSizes }: StatementVotesTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn | null>("rawAgreeVotes");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: SortColumn) {
    if (sortCol === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const sorted = [...statements].sort((a, b) => {
    if (!sortCol) return 0;
    return sortDir === "desc" ? b[sortCol] - a[sortCol] : a[sortCol] - b[sortCol];
  });

  if (statements.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br info-gradient flex items-center justify-center">
          <List className="w-5 h-5 normal-text" />
        </div>
        <div>
          <h2 className="text-xl">All Statements</h2>
          <p className="text-sm text-muted-foreground">Vote breakdown for every statement</p>
        </div>
      </div>

      <div>
        <table className="w-full text-sm">
          <StatementVotesTableHead
            totalParticipants={totalParticipants}
            clusterSizes={clusterSizes}
            sort={{ sortCol, sortDir, onSort: handleSort }}
          />
          <tbody>
            {sorted.map((row) => (
              <StatementVotesTableRow
                key={row.id}
                statement={row}
                totalParticipants={totalParticipants}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
