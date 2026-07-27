import { getClusterColor } from "../../utils/colors";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui/badge";
import { ChevronUp, ChevronDown } from "lucide-react";

export type SortColumn = "rawAgreeVotes" | "superAgreeVotes" | "disagreeVotes" | "passVotes" | "totalVotes";
export type SortDir = "asc" | "desc";

export const COLUMNS: { key: SortColumn; labelKey: string; badgeClass: string }[] = [
  { key: "rawAgreeVotes", labelKey: "colAgree", badgeClass: "agree-bg agree-text agree-border" },
  { key: "superAgreeVotes", labelKey: "colSuperAgree", badgeClass: "super-agree-bg super-agree-text super-agree-border" },
  { key: "disagreeVotes", labelKey: "colDisagree", badgeClass: "disagree-bg disagree-text disagree-border" },
  { key: "passVotes", labelKey: "colPass", badgeClass: "pass-bg pass-text pass-border" },
  { key: "totalVotes", labelKey: "colTotal", badgeClass: "total-bg total-text total-border" },
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
  colorAllClusters?: boolean;
  sort?: SortState;
}

export function StatementVotesTableHead({
  totalParticipants,
  clusterSizes,
  showNumbers,
  highlightClusterIndex,
  colorAllClusters,
  sort,
}: StatementVotesTableHeadProps) {
  const { t } = useTranslation("analysis");
  return (
    <thead>
      <tr className="border-b">
        <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-1/2">{t("statementColumn")}</th>
        {showNumbers &&
          COLUMNS.map(({ key, labelKey, badgeClass }) => (
            <th key={key} className="py-2 px-2 text-right whitespace-nowrap">
              {sort ? (
                <button
                  onClick={() => sort.onSort(key)}
                  className="flex items-center gap-1 ml-auto font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Badge variant="outline" className={`${badgeClass} text-xs`}>
                    {t(labelKey)}
                  </Badge>
                  <SortIcon column={key} sortCol={sort.sortCol} sortDir={sort.sortDir} />
                </button>
              ) : (
                <Badge variant="outline" className={`${badgeClass} text-xs ml-auto`}>
                  {t(labelKey)}
                </Badge>
              )}
            </th>
          ))}
        <th className={`py-2 px-2 text-center whitespace-nowrap font-medium text-muted-foreground${showNumbers ? " border-l" : ""}`}>
          <div className="text-xs">{t("overall")}</div>
          <div className="text-xs text-muted-foreground font-normal">{t("userCount", { count: totalParticipants })}</div>
        </th>
        {clusterSizes.map((size, idx) => {
          const colored = colorAllClusters || idx === highlightClusterIndex;
          return (
            <th
              key={idx}
              className={`py-2 px-2 text-center whitespace-nowrap font-medium text-muted-foreground${colored ? ` ${getClusterColor(idx).bg}` : ""}`}
            >
              <div className="text-xs">{t("cluster", { label: clusterLabel(idx) })}</div>
              <div className="text-xs text-muted-foreground font-normal">{t("userCount", { count: size })}</div>
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
