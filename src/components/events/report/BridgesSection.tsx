import { useState } from "react";
import type {
  EventReportBridge,
  EventReportCamp,
  EventReportCampAnalysis,
  EventReportPost,
  EventReportStatementByCamp,
} from "../../../types";
import { findPostTopic } from "../../../utils/event-report";
import {
  describeVennRegion,
  getVennRegionKey,
} from "../../../utils/event-report-venn";
import { Button } from "../../ui/button";
import { CampAgreementBars } from "./CampAgreementBars";
import { CampVenn } from "./CampVenn";
import { REPORT_SECTION_IDS } from "./report-sections";
import { ResponseMark } from "./ResponseMark";
import { SectionHeading } from "./SectionHeading";
import "./report.css";

const BRIDGES_DESCRIPTION =
  "Every statement of the session, placed by which camps agreed with it (60% or more of the camp). Hover over any dot to see it.";

interface BridgesSectionProps {
  campAnalysis: EventReportCampAnalysis;
  posts: EventReportPost[];
}

export function BridgesSection({
  campAnalysis,
  posts,
}: BridgesSectionProps) {
  const { camps, statementsByCamp, bridges } = campAnalysis;
  const [selectedStatementId, setSelectedStatementId] = useState(
    () =>
      bridges[0]?.statement.statementId ??
      statementsByCamp[0]?.statementId,
  );
  const selectedStatement = statementsByCamp.find(
    (statement) => statement.statementId === selectedStatementId,
  );
  if (camps.length === 0 || !selectedStatement) return null;

  return (
    <section
      id={REPORT_SECTION_IDS.bridges}
      className="report-section-bg scroll-mt-16"
    >
      <div className="report-section-content py-16">
        <SectionHeading
          sectionNumber={5}
          sectionName="What bridged them"
          headline={describeBridges(camps, bridges)}
          description={BRIDGES_DESCRIPTION}
        />
        <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
          <div className="normal-bg min-w-0 rounded-3xl p-5">
            <CampVenn
              camps={camps}
              statements={statementsByCamp}
              selectedStatementId={selectedStatementId}
              onSelectStatement={setSelectedStatementId}
            />
          </div>
          <SelectedStatementPanel
            camps={camps}
            statement={selectedStatement}
            posts={posts}
            bridges={bridges}
            onSelectStatement={setSelectedStatementId}
          />
        </div>
      </div>
    </section>
  );
}

function describeBridges(
  camps: EventReportCamp[],
  bridges: EventReportBridge[],
): string {
  const campPairCount = (camps.length * (camps.length - 1)) / 2;
  if (campPairCount > 0 && bridges.length >= campPairCount) {
    return "But everyone found something to agree on.";
  }
  if (bridges.length > 0) {
    return "Some of the camps found something to agree on.";
  }
  return "The camps didn't find much to agree on.";
}

interface SelectedStatementPanelProps {
  camps: EventReportCamp[];
  statement: EventReportStatementByCamp;
  posts: EventReportPost[];
  bridges: EventReportBridge[];
  onSelectStatement: (statementId: string) => void;
}

function SelectedStatementPanel({
  camps,
  statement,
  posts,
  bridges,
  onSelectStatement,
}: SelectedStatementPanelProps) {
  const campIds = camps.map((camp) => camp.campId);
  const regionDescription = describeVennRegion(
    getVennRegionKey(statement, campIds),
    camps,
  );

  return (
    <div className="normal-bg flex flex-col gap-4 rounded-3xl p-6">
      {statement.isAttendeeStatement && (
        <span className="report-response-bg report-response-strong-text flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-semibold">
          <ResponseMark className="h-3.5 w-3.5 shrink-0" />
          Idea from the floor
        </span>
      )}
      <p className="text-sm secondary-text-strong">
        {findPostTopic(posts, statement.postNumber)}
      </p>
      <p className="text-2xl font-bold leading-snug">
        {statement.text}
      </p>
      <p className="text-sm font-semibold secondary-text-strong">
        {regionDescription}
      </p>
      <CampAgreementBars camps={camps} statement={statement} />
      <p className="text-sm secondary-text-strong">
        Whole room: {statement.overallAgreePercent}% agree
      </p>
      {bridges.length > 0 && (
        <BridgeButtons
          camps={camps}
          bridges={bridges}
          onSelectStatement={onSelectStatement}
        />
      )}
    </div>
  );
}

interface BridgeButtonsProps {
  camps: EventReportCamp[];
  bridges: EventReportBridge[];
  onSelectStatement: (statementId: string) => void;
}

function BridgeButtons({
  camps,
  bridges,
  onSelectStatement,
}: BridgeButtonsProps) {
  const findCampName = (campId: string) =>
    camps.find((camp) => camp.campId === campId)?.name ?? "";

  return (
    <div className="mt-auto flex flex-col gap-2 border-t pt-4">
      <span className="report-label text-xs secondary-text">
        Strongest bridges
      </span>
      <div className="flex flex-wrap gap-2">
        {bridges.map((bridge) => (
          <Button
            key={bridge.statement.statementId}
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onSelectStatement(bridge.statement.statementId)
            }
            className="h-auto min-h-9 whitespace-normal rounded-full py-1.5"
          >
            {bridge.campIds.map(findCampName).join(" + ")}
          </Button>
        ))}
      </div>
    </div>
  );
}