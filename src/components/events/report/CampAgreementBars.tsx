import type {
  EventReportCamp,
  EventReportStatementByCamp,
} from "../../../types";
import { getCampAgreePercent } from "../../../utils/event-report-venn";
import { getCampColorClassNames } from "./camp-colors";
import "./report.css";

interface CampAgreementBarsProps {
  camps: EventReportCamp[];
  statement: EventReportStatementByCamp;
}

export function CampAgreementBars({
  camps,
  statement,
}: CampAgreementBarsProps) {
  return (
    <div className="flex flex-col gap-2 text-sm secondary-text-strong">
      {camps.map((camp, campIndex) => {
        const agreePercent = getCampAgreePercent(
          statement,
          camp.campId,
        );
        return (
          <div key={camp.campId} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate">
              {camp.name}
            </span>
            <div className="report-bar-track h-2 flex-1 overflow-hidden rounded-full">
              <div
                className={`${getCampColorClassNames(campIndex).solidBackground} h-full rounded-full`}
                style={{ width: `${agreePercent}%` }}
              />
            </div>
            <span className="w-10 text-right tabular-nums">
              {agreePercent}%
            </span>
          </div>
        );
      })}
    </div>
  );
}