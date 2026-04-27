import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { List, ChevronUp, ChevronDown, CornerLeftUp } from "lucide-react";
import { StatementVotes } from "../../types";
import { VoteBreakdownPie } from "./VoteBreakdownPie";

type SortColumn = "rawAgreeVotes" | "superAgreeVotes" | "disagreeVotes" | "passVotes" | "totalVotes";
type SortDir = "asc" | "desc";

interface StatementVotesTableProps {
  statements: StatementVotes[];
  totalParticipants: number;
  clusterSizes: number[];
}

const COLUMNS: { key: SortColumn; label: string; badgeClass: string }[] = [
  { key: "rawAgreeVotes", label: "Agree", badgeClass: "agree-bg agree-text agree-border" },
  { key: "superAgreeVotes", label: "Super Agree", badgeClass: "super-agree-bg super-agree-text super-agree-border" },
  { key: "disagreeVotes", label: "Disagree", badgeClass: "disagree-bg disagree-text disagree-border" },
  { key: "passVotes", label: "Pass", badgeClass: "pass-bg pass-text pass-border" },
  { key: "totalVotes", label: "Total", badgeClass: "total-bg total-text total-border" },
];

function clusterLabel(idx: number): string {
  return String.fromCharCode(65 + idx);
}

function SortIcon({ column, sortCol, sortDir }: { column: SortColumn; sortCol: SortColumn | null; sortDir: SortDir }) {
  if (sortCol !== column) return null;
  return sortDir === "desc"
    ? <ChevronDown className="w-3 h-3" />
    : <ChevronUp className="w-3 h-3" />;
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
              <th className="py-2 px-2 text-right whitespace-nowrap font-medium text-muted-foreground border-l">
                <div className="text-xs">Overall</div>
                <div className="text-xs text-muted-foreground font-normal">{totalParticipants}</div>
              </th>
              {clusterSizes.map((size, idx) => (
                <th key={idx} className="py-2 px-2 text-right whitespace-nowrap font-medium text-muted-foreground">
                  <div className="text-xs">{clusterLabel(idx)}</div>
                  <div className="text-xs text-muted-foreground font-normal">{size}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-3 pr-4 text-sm leading-snug">
                  <span>{row.text}</span>
                  {row.mergedFrom && row.mergedFrom.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {row.mergedFrom.map((merged) => (
                        <div key={merged.id} className="flex items-start gap-1 text-xs text-muted-foreground">
                          <CornerLeftUp className="w-3 h-3 mt-0.5" />
                          <span>{merged.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-3 px-2 text-right tabular-nums agree-text font-medium">{row.rawAgreeVotes}</td>
                <td className="py-3 px-2 text-right tabular-nums super-agree-text font-medium">{row.superAgreeVotes}</td>
                <td className="py-3 px-2 text-right tabular-nums disagree-text font-medium">{row.disagreeVotes}</td>
                <td className="py-3 px-2 text-right tabular-nums pass-text font-medium">{row.passVotes}</td>
                <td className="py-3 px-2 text-right tabular-nums total-text font-medium">{row.totalVotes}</td>
                <td className="py-3 px-2 align-middle border-l">
                  <VoteBreakdownPie
                    rawAgree={row.rawAgreeVotes}
                    superAgree={row.superAgreeVotes}
                    disagree={row.disagreeVotes}
                    pass={row.passVotes}
                    size={totalParticipants}
                  />
                </td>
                {clusterSizes.map((size, idx) => {
                  const cv = row.clusterVotes?.[idx];
                  const cvSuper = cv?.superAgreeVotes ?? 0;
                  const cvRawAgree = (cv?.agreeVotes ?? 0) - cvSuper;
                  return (
                    <td key={idx} className="py-3 px-2 align-middle">
                      <VoteBreakdownPie
                        rawAgree={cvRawAgree}
                        superAgree={cvSuper}
                        disagree={cv?.disagreeVotes ?? 0}
                        pass={cv?.passVotes ?? 0}
                        size={cv?.clusterSize ?? size}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
