import { MessageCirclePlus } from "lucide-react";
import type {
  EventReportCamp,
  EventReportStatementByCamp,
} from "../../../types";
import {
  getVennCampLabelPositions,
  getVennCircleCenters,
  getVennDotSizePx,
  placeVennDots,
  VENN_CIRCLE_DIAMETER_PX,
  VENN_HEIGHT_PX,
  VENN_WIDTH_PX,
  type VennDot,
} from "../../../utils/event-report-venn";
import { getCampColorClassNames } from "./camp-colors";
import "./report.css";

const DOT_BUTTON_PX = 26;

interface CampVennProps {
  camps: EventReportCamp[];
  statements: EventReportStatementByCamp[];
  selectedStatementId: string | undefined;
  onSelectStatement: (statementId: string) => void;
}

export function CampVenn({
  camps,
  statements,
  selectedStatementId,
  onSelectStatement,
}: CampVennProps) {
  const campIds = camps.map((camp) => camp.campId);
  const circleCenters = getVennCircleCenters(camps.length);
  const labelPositions = getVennCampLabelPositions(camps.length);
  const vennDots = placeVennDots(statements, campIds);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div
          className="relative mx-auto"
          style={{ width: VENN_WIDTH_PX, height: VENN_HEIGHT_PX }}
        >
          {circleCenters.map((center, campIndex) => (
            <span
              key={campIds[campIndex]}
              aria-hidden="true"
              className={`${getCampColorClassNames(campIndex).circle} absolute rounded-full border-2`}
              style={{
                left: center.x - VENN_CIRCLE_DIAMETER_PX / 2,
                top: center.y - VENN_CIRCLE_DIAMETER_PX / 2,
                width: VENN_CIRCLE_DIAMETER_PX,
                height: VENN_CIRCLE_DIAMETER_PX,
              }}
            />
          ))}
          {labelPositions.map((position, campIndex) => (
            <span
              key={campIds[campIndex]}
              className={`${getCampColorClassNames(campIndex).strongText} absolute text-sm font-semibold`}
              style={{ left: position.x, top: position.y }}
            >
              {camps[campIndex].name}
            </span>
          ))}
          <span className="absolute bottom-0 left-1.5 text-xs secondary-text">
            No camp agreed
          </span>
          {vennDots.map((vennDot) => (
            <VennDotButton
              key={vennDot.statement.statementId}
              vennDot={vennDot}
              isSelected={
                vennDot.statement.statementId === selectedStatementId
              }
              onSelect={() =>
                onSelectStatement(vennDot.statement.statementId)
              }
            />
          ))}
        </div>
      </div>
      <VennLegend />
    </div>
  );
}

interface VennDotButtonProps {
  vennDot: VennDot;
  isSelected: boolean;
  onSelect: () => void;
}

function VennDotButton({
  vennDot,
  isSelected,
  onSelect,
}: VennDotButtonProps) {
  const { statement } = vennDot;
  const dotSizePx = getVennDotSizePx(statement.overallAgreePercent);
  const selectedClassName = isSelected
    ? "report-venn-selected-dot"
    : "";

  return (
    <button
      type="button"
      aria-label={statement.text}
      aria-pressed={isSelected}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      className="absolute flex items-center justify-center"
      style={{
        left: vennDot.x - DOT_BUTTON_PX / 2,
        top: vennDot.y - DOT_BUTTON_PX / 2,
        width: DOT_BUTTON_PX,
        height: DOT_BUTTON_PX,
      }}
    >
      {statement.isAttendeeStatement ? (
        <span
          className={`normal-bg flex rounded-full ${selectedClassName}`}
        >
          <MessageCirclePlus
            aria-hidden="true"
            className="report-response-strong-text"
            style={{ width: dotSizePx + 4, height: dotSizePx + 4 }}
          />
        </span>
      ) : (
        <span
          className={`report-venn-dot rounded-full ${selectedClassName}`}
          style={{ width: dotSizePx, height: dotSizePx }}
        />
      )}
    </button>
  );
}

function VennLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm secondary-text-strong">
      <span className="flex items-center gap-1.5">
        <span className="report-venn-dot h-3 w-3 rounded-full" />
        Prepared statement
      </span>
      <span className="flex items-center gap-1.5">
        <MessageCirclePlus
          aria-hidden="true"
          className="report-response-strong-text h-4 w-4"
        />
        Idea from the floor
      </span>
      <span>Bigger dot = more of the room agreed</span>
    </div>
  );
}