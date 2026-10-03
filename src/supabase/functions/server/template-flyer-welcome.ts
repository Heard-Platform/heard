import { escapeHtml } from "./utils.tsx";
import type { VoteType } from "./types.tsx";
import {
  BODY_STYLE,
  COLORS,
  css,
  EYEBROW_STYLE,
  HEADING_STYLE,
  renderDocument,
  renderMascot,
  voteColor,
  voteLabel,
} from "./template-flyer-utils.ts";

export const FLYER_WELCOME_EMAIL_TYPE = "flyer_welcome";

export const getFlyerWelcomeSubject = (areResultsTomorrow: boolean): string =>
  areResultsTomorrow ? "You're in. Results drop tomorrow at 7pm." : "You're in. Results drop at 7pm.";

export interface FlyerWelcomeEmailData {
  statementText: string;
  vote: VoteType;
  areResultsTomorrow: boolean;
  userId: string;
}

const HEADER_STYLE = css({ textAlign: "center" });
const MASCOT_WRAPPER_STYLE = css({ display: "inline-block" });
const TITLE_STYLE = css({ ...HEADING_STYLE, margin: "12px 0 20px", fontSize: "30px", lineHeight: 1.2 });
const STATEMENT_BOX_STYLE = css({
  backgroundColor: COLORS.tint,
  borderRadius: "10px",
  padding: "14px 16px",
  marginBottom: "20px",
});
const STATEMENT_STYLE = css({ ...HEADING_STYLE, margin: 0, fontSize: "18px", lineHeight: 1.35 });
const MESSAGE_STYLE = css({ ...BODY_STYLE, margin: 0, textAlign: "center", fontSize: "15px" });
const RESULTS_TIME_STYLE = css({ color: COLORS.ink });

const voteLabelStyle = (vote: VoteType) => css({ ...EYEBROW_STYLE, margin: "0 0 6px", color: voteColor(vote) });

export const generateFlyerWelcomeEmailHtml = (data: FlyerWelcomeEmailData): string => {
  const resultsTime = data.areResultsTomorrow ? "tomorrow at 7pm" : "7pm tonight";
  const content = `
    <div style="${HEADER_STYLE}">
      <div style="${MASCOT_WRAPPER_STYLE}">${renderMascot(120)}</div>
      <h1 style="${TITLE_STYLE}">You're in.</h1>
    </div>

    <div style="${STATEMENT_BOX_STYLE}">
      <p style="${voteLabelStyle(data.vote)}">${voteLabel(data.vote)}</p>
      <p style="${STATEMENT_STYLE}">${escapeHtml(data.statementText)}</p>
    </div>

    <p style="${MESSAGE_STYLE}">
      Your vote is counted. Results drop at <strong style="${RESULTS_TIME_STYLE}">${resultsTime}</strong>,
      and we'll send them your way.
    </p>
  `;
  return renderDocument(getFlyerWelcomeSubject(data.areResultsTomorrow), content, data.userId);
};

export const generateFakeFlyerWelcomeData = (): FlyerWelcomeEmailData => ({
  statementText: "DC should let driverless Waymo cars operate citywide.",
  vote: "agree",
  areResultsTomorrow: false,
  userId: "preview-user",
});
