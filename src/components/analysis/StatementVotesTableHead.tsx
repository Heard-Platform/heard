import { getClusterColor } from "../../utils/colors";
import { Badge } from "../ui/badge";
import { ChevronUp, ChevronDown } from "lucide-react";

export type SortColumn = "rawAgreeVotes" | "superAgreeVotes" | "disagreeVotes" | "passVotes" | "totalVotes";
export type SortDir = "asc" | "desc";

export const COLUMNS: { key: SortColumn; label: string; badgeClass: string }[] = [
  { key: "rawAgreeVotes", label: "Agree", badgeClass: "agree-bg agree-text agree-border" },
  { key: "superAgreeVotes", label: "Super Agree", badgeClass: "super-agree-bg super-agree-text super-agree-border" },
  { key: "disagreeVotes", label: "Disagree", badgeClass: "disagree-bg disagree-text disagree-border" },
  { key: "passVotes", label: "Pass", badgeClass: "pass-bg pass-text pass-border" },
  { key: "totalVotes", label: "Total", badgeClass: "total-bg total-text total-border" },
];

export function clusterLabel(idx: number): string {
  return String.fromCharCode(65 + idx);
}

interface SortState {
  sortCol: SortColumn | null;
  sortDir: SortDir;
  onSort: (col: SortColumn) => void;
}

interface StatementVotesTableHeadProps {
  totalParticipants: number;
  clusterSizes: number[];
  showNumbers: boolean;
  highlightClusterIndex?: number;
  highlightClusterIndices?: number[];
  colorAllClusters?: boolean;
  sort?: SortState;
}

export function StatementVotesTableHead({
  totalParticipants,
  clusterSizes,
  showNumbers,
  highlightClusterIndex,
  highlightClusterIndices,
  colorAllClusters,
  sort,
}: StatementVotesTableHeadProps) {
  return (
    <thead>
      <tr className="border-b">
        <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-1/2">Statement</th>
        {showNumbers &&
          COLUMNS.map(({ key, label, badgeClass }) => (
            <th key={key} className="py-2 px-2 text-right whitespace-nowrap">
              {sort ? (
                <button
                  onClick={() => sort.onSort(key)}
                  className="flex items-center gap-1 ml-auto font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Badge variant="outline" className={`${badgeClass} text-xs`}>
                    {label}
                  </Badge>
                  <SortIcon column={key} sortCol={sort.sortCol} sortDir={sort.sortDir} />
                </button>
              ) : (
                <Badge variant="outline" className={`${badgeClass} text-xs ml-auto`}>
                  {label}
                </Badge>
              )}
            </th>
          ))}
        <th className={`py-2 px-2 text-center whitespace-nowrap font-medium text-muted-foreground${showNumbers ? " border-l" : ""}`}>
          <div className="text-xs">Overall</div>
          <div className="text-xs text-muted-foreground font-normal">{totalParticipants} users</div>
        </th>
        {clusterSizes.map((size, idx) => {
          const colored =
            colorAllClusters || idx === highlightClusterIndex || highlightClusterIndices?.includes(idx);
          return (
            <th
              key={idx}
              className={`py-2 px-2 text-center whitespace-nowrap font-medium text-muted-foreground${colored ? ` ${getClusterColor(idx).bg}` : ""}`}
            >
              <div className="text-xs">Cluster {clusterLabel(idx)}</div>
              <div className="text-xs text-muted-foreground font-normal">{size} users</div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function SortIcon({ column, sortCol, sortDir }: { column: SortColumn; sortCol: SortColumn | null; sortDir: SortDir }) {
  if (sortCol !== column) return null;
  return sortDir === "desc"
    ? <ChevronDown className="w-3 h-3" />
    : <ChevronUp className="w-3 h-3" />;
}
