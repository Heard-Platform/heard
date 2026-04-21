import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { List, ChevronUp, ChevronDown } from "lucide-react";

export interface StatementVoteRow {
  id: string;
  text: string;
  agreeVotes: number;
  superAgreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
  totalVotes: number;
}

type SortColumn = "agreeVotes" | "superAgreeVotes" | "disagreeVotes" | "passVotes" | "totalVotes";
type SortDir = "asc" | "desc";

interface StatementVotesTableProps {
  statements: StatementVoteRow[];
}

const COLUMNS: { key: SortColumn; label: string; badgeClass: string }[] = [
  { key: "agreeVotes", label: "Agree", badgeClass: "agree-bg agree-text agree-border" },
  { key: "superAgreeVotes", label: "Super Agree", badgeClass: "super-agree-bg super-agree-text super-agree-border" },
  { key: "disagreeVotes", label: "Disagree", badgeClass: "disagree-bg disagree-text disagree-border" },
  { key: "passVotes", label: "Pass", badgeClass: "pass-bg pass-text pass-border" },
  { key: "totalVotes", label: "Total", badgeClass: "total-bg total-text total-border" },
];

function SortIcon({ column, sortCol, sortDir }: { column: SortColumn; sortCol: SortColumn | null; sortDir: SortDir }) {
  if (sortCol !== column) return null;
  return sortDir === "desc"
    ? <ChevronDown className="w-3 h-3" />
    : <ChevronUp className="w-3 h-3" />;
}

export function StatementVotesTable({ statements }: StatementVotesTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn | null>("agreeVotes");
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-full">Statement</th>
              {COLUMNS.map(({ key, label, badgeClass }) => (
                <th key={key} className="py-2 px-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleSort(key)}
                    className="flex items-center gap-1 ml-auto font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Badge variant="outline" className={`${badgeClass} text-xs`}>
                      {label}
                    </Badge>
                    <SortIcon column={key} sortCol={sortCol} sortDir={sortDir} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-3 pr-4 text-sm leading-snug">{row.text}</td>
                <td className="py-3 px-2 text-right tabular-nums agree-text font-medium">{row.agreeVotes}</td>
                <td className="py-3 px-2 text-right tabular-nums super-agree-text font-medium">{row.superAgreeVotes}</td>
                <td className="py-3 px-2 text-right tabular-nums disagree-text font-medium">{row.disagreeVotes}</td>
                <td className="py-3 px-2 text-right tabular-nums pass-text font-medium">{row.passVotes}</td>
                <td className="py-3 px-2 text-right tabular-nums total-text font-medium">{row.totalVotes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
