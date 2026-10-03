import { escapeHtml } from "./utils.tsx";
import type { Statement, VoteType } from "./types.tsx";
import {
  BODY_STYLE,
  COLORS,
  css,
  EYEBROW_STYLE,
  HEADING_STYLE,
  renderButton,
  renderDocument,
  renderMascot,
  renderSplitBar,
  type Style,
  summarizeVoteSplit,
  TABLE_ATTRS,
  type VoteSplit,
  voteColor,
  voteLabel,
} from "./template-flyer-utils.ts";

export const FLYER_RESULTS_EMAIL_TYPE = "flyer_results";
export const FLYER_RESULTS_SUBJECT = "Results are in: driverless Waymo cars in DC";

export interface FlyerResultsEmailData {
  flyerStatement: Statement;
  vote: VoteType;
  otherStatements: Statement[];
  frontendUrl: string;
  seeMoreUrl: string;
  voteMoreUrl: string;
  unsubscribeUrl: string;
}

const PERCENT_STYLE: Style = { fontSize: "14px", fontWeight: 700 };
const LEGEND_SWATCH_STYLE: Style = { display: "inline-block", width: "9px", height: "9px", verticalAlign: "middle" };

const HEADER_STYLE = css({ marginBottom: "20px" });
const MASCOT_CELL_STYLE = css({ paddingRight: "12px" });
const KICKER_STYLE = css({ ...EYEBROW_STYLE, margin: "0 0 2px", color: COLORS.button });
const TITLE_STYLE = css({ ...HEADING_STYLE, margin: 0, fontSize: "24px", lineHeight: 1.2 });
const STATEMENT_BOX_STYLE = css({
  backgroundColor: COLORS.tint,
  border: `2px solid ${COLORS.border}`,
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "16px",
});
const STATEMENT_STYLE = css({ ...HEADING_STYLE, margin: "0 0 14px", fontSize: "20px", lineHeight: 1.3 });
const PERCENTS_TABLE_STYLE = css({ margin: "8px 0 10px" });
const AGREE_PERCENT_STYLE = css({ ...PERCENT_STYLE, color: COLORS.agree });
const DISAGREE_PERCENT_STYLE = css({ ...PERCENT_STYLE, color: COLORS.disagree });
const STANDING_STYLE = css({ ...BODY_STYLE, margin: 0, fontSize: "13px" });

const OTHER_STATEMENT_STYLE = css({ marginBottom: "14px" });
const OTHER_STATEMENT_ROW_STYLE = css({ marginBottom: "6px" });
const OTHER_STATEMENT_TEXT_STYLE = css({ fontSize: "14px", lineHeight: 1.35, color: COLORS.ink, paddingRight: "12px" });
const OTHER_STATEMENT_PERCENT_STYLE = css({ ...PERCENT_STYLE, color: COLORS.ink, whiteSpace: "nowrap" });
const OTHERS_HEADING_STYLE = css({ ...EYEBROW_STYLE, margin: "28px 0 14px", color: COLORS.muted });
const LEGEND_STYLE = css({ margin: "4px 0 16px", fontSize: "12px", color: COLORS.muted });
const AGREE_SWATCH_STYLE = css({ ...LEGEND_SWATCH_STYLE, backgroundColor: COLORS.agree });
const DISAGREE_SWATCH_STYLE = css({ ...LEGEND_SWATCH_STYLE, backgroundColor: COLORS.disagree });
const STILL_OPEN_STYLE = css({ ...BODY_STYLE, margin: "0 0 20px", fontSize: "13px" });

const voteLabelStyle = (vote: VoteType) => css({ ...EYEBROW_STYLE, margin: "0 0 8px", color: voteColor(vote) });

const describeVoterStanding = (vote: VoteType, split: VoteSplit): string => {
  const sidePercent = vote === "disagree" ? split.disagreePercent : split.agreePercent;
  if (sidePercent > 50) return "You're with the majority on this one.";
  if (sidePercent < 50) return "You're with the minority on this one.";
  return "It's an even split.";
};

const renderOtherStatement = (statement: Statement) => {
  const split = summarizeVoteSplit(statement);
  return `
    <div style="${OTHER_STATEMENT_STYLE}">
      <table width="100%" ${TABLE_ATTRS} style="${OTHER_STATEMENT_ROW_STYLE}">
        <tr>
          <td style="${OTHER_STATEMENT_TEXT_STYLE}">${escapeHtml(statement.text)}</td>
          <td align="right" valign="top" style="${OTHER_STATEMENT_PERCENT_STYLE}">${split.agreePercent}% agree</td>
        </tr>
      </table>
      ${renderSplitBar(split, 6)}
    </div>
  `;
};

const renderOtherStatements = (statements: Statement[], voteMoreUrl: string) => {
  if (statements.length === 0) return "";
  return `
    <p style="${OTHERS_HEADING_STYLE}">More from this conversation</p>
    ${statements.map(renderOtherStatement).join("")}
    <p style="${LEGEND_STYLE}">
      <span style="${AGREE_SWATCH_STYLE}"></span> Agree
      &nbsp;&nbsp;
      <span style="${DISAGREE_SWATCH_STYLE}"></span> Disagree
    </p>
    <p style="${STILL_OPEN_STYLE}">The conversation is still open, so these numbers can change.</p>
    ${renderButton(voteMoreUrl, "Vote on more statements", "outline")}
  `;
};

export const generateFlyerResultsEmailHtml = (data: FlyerResultsEmailData): string => {
  const split = summarizeVoteSplit(data.flyerStatement);
  const voteCountText = `${split.voteCount} ${split.voteCount === 1 ? "vote" : "votes"} so far.`;

  const content = `
    <table ${TABLE_ATTRS} style="${HEADER_STYLE}">
      <tr>
        <td valign="middle" style="${MASCOT_CELL_STYLE}">${renderMascot(data.frontendUrl, 68)}</td>
        <td valign="middle">
          <p style="${KICKER_STYLE}">Results are in</p>
          <h1 style="${TITLE_STYLE}">Here's how DC voted.</h1>
        </td>
      </tr>
    </table>

    <div style="${STATEMENT_BOX_STYLE}">
      <p style="${voteLabelStyle(data.vote)}">Your statement · ${voteLabel(data.vote)}</p>
      <p style="${STATEMENT_STYLE}">${escapeHtml(data.flyerStatement.text)}</p>
      ${renderSplitBar(split, 10)}
      <table width="100%" ${TABLE_ATTRS} style="${PERCENTS_TABLE_STYLE}">
        <tr>
          <td style="${AGREE_PERCENT_STYLE}">${split.agreePercent}% agree</td>
          <td align="right" style="${DISAGREE_PERCENT_STYLE}">${split.disagreePercent}% disagree</td>
        </tr>
      </table>
      <p style="${STANDING_STYLE}">${voteCountText} ${describeVoterStanding(data.vote, split)}</p>
    </div>

    ${renderButton(data.seeMoreUrl, "See more statements", "solid")}

    ${renderOtherStatements(data.otherStatements, data.voteMoreUrl)}
  `;
  return renderDocument(FLYER_RESULTS_SUBJECT, content, data.unsubscribeUrl);
};

const fakeStatement = (id: string, text: string, agrees: number, disagrees: number): Statement => ({
  id,
  text,
  author: "preview-user",
  agrees,
  superAgrees: 0,
  disagrees,
  passes: 0,
  roomId: "preview-room",
  timestamp: Date.now(),
  round: 1,
  voters: {},
});

export const generateFakeFlyerResultsData = (frontendUrl: string): FlyerResultsEmailData => ({
  flyerStatement: fakeStatement("s1", "DC should let driverless Waymo cars operate citywide.", 144, 168),
  vote: "agree",
  otherStatements: [
    fakeStatement("s2", "Waymo should publish its crash data.", 93, 7),
    fakeStatement("s3", "Driverless cars will make DC streets safer.", 51, 49),
    fakeStatement("s4", "Waymo will take work from DC drivers.", 68, 32),
  ],
  frontendUrl,
  seeMoreUrl: `${frontendUrl}/room/preview-room`,
  voteMoreUrl: `${frontendUrl}/room/preview-room`,
  unsubscribeUrl: `${frontendUrl}/unsubscribe?userId=preview-user`,
});
