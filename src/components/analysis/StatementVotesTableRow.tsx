import { ReactNode } from "react";
import { CornerLeftUp } from "lucide-react";
import { StatementVotes } from "../../types";
import { VoteBreakdownPie } from "./VoteBreakdownPie";
import { getClusterColor } from "../../utils/colors";
import { RenderedStatement } from "../RenderedStatement";

interface StatementVotesTableRowProps {
  statement: StatementVotes;
  totalParticipants: number;
  showNumbers: boolean;
  clusterIndex?: number;
  highlightClusterIndices?: number[];
  colorAllClusters?: boolean;
  caption?: ReactNode;
}

function rowCounts(statement: StatementVotes, clusterIndex: number | undefined) {
  if (clusterIndex === undefined) {
    return {
      rawAgree: statement.rawAgreeVotes,
      superAgree: statement.superAgreeVotes,
      disagree: statement.disagreeVotes,
      pass: statement.passVotes,
      total: statement.totalVotes,
    };
  }
  const cv = statement.clusterVotes[clusterIndex];
  const superAgree = cv.superAgreeVotes;
  const rawAgree = cv.agreeVotes - superAgree;
  return {
    rawAgree,
    superAgree,
    disagree: cv.disagreeVotes,
    pass: cv.passVotes,
    total: rawAgree + superAgree + cv.disagreeVotes + cv.passVotes,
  };
}

export function StatementVotesTableRow({
  statement,
  totalParticipants,
  showNumbers,
  clusterIndex,
  highlightClusterIndices,
  colorAllClusters,
  caption,
}: StatementVotesTableRowProps) {
  const counts = rowCounts(statement, clusterIndex);
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3 pr-4 text-sm leading-snug">
        {caption}
        <span><RenderedStatement text={statement.text} /></span>
        {statement.mergedFrom && statement.mergedFrom.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {statement.mergedFrom.map((merged) => (
              <div key={merged.id} className="flex items-start gap-1 text-xs text-muted-foreground">
                <CornerLeftUp className="w-3 h-3 mt-0.5" />
                <span><RenderedStatement text={merged.text} /></span>
              </div>
            ))}
          </div>
        )}
      </td>
      {showNumbers && (
        <>
          <td className="py-3 px-2 text-right tabular-nums agree-text font-medium">{counts.rawAgree}</td>
          <td className="py-3 px-2 text-right tabular-nums super-agree-text font-medium">{counts.superAgree}</td>
          <td className="py-3 px-2 text-right tabular-nums disagree-text font-medium">{counts.disagree}</td>
          <td className="py-3 px-2 text-right tabular-nums pass-text font-medium">{counts.pass}</td>
          <td className="py-3 px-2 text-right tabular-nums total-text font-medium">{counts.total}</td>
        </>
      )}
      <td className={`py-3 px-2 align-middle${showNumbers ? " border-l" : ""}`}>
        <VoteBreakdownPie
          rawAgree={statement.rawAgreeVotes}
          superAgree={statement.superAgreeVotes}
          disagree={statement.disagreeVotes}
          pass={statement.passVotes}
          size={totalParticipants}
          showNumbers={showNumbers}
        />
      </td>
      {statement.clusterVotes.map((cv, idx) => {
        const cvSuper = cv.superAgreeVotes;
        const cvRawAgree = cv.agreeVotes - cvSuper;
        const colored =
          colorAllClusters || idx === clusterIndex || highlightClusterIndices?.includes(idx);
        return (
          <td
            key={idx}
            className={`py-3 px-2 align-middle${colored ? ` ${getClusterColor(idx).bg}` : ""}`}
          >
            <VoteBreakdownPie
              rawAgree={cvRawAgree}
              superAgree={cvSuper}
              disagree={cv.disagreeVotes}
              pass={cv.passVotes}
              size={cv.clusterSize}
              showNumbers={showNumbers}
            />
          </td>
        );
      })}
    </tr>
  );
}
