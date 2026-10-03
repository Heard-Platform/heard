import { escapeHtml, getFrontendUrl } from "./utils.tsx";
import type { Statement, VoteType } from "./types.tsx";
import { getOpinionatedVoteCount } from "./statement-utils.tsx";

export const COLORS = {
  page: "#F2ECE0",
  card: "#FFFFFF",
  tint: "#F2ECE0",
  ink: "#1C1B1F",
  body: "#4A463F",
  muted: "#6B6760",
  border: "#1C1B1F",
  button: "#B5401F",
  agree: "#16A34A",
  disagree: "#DC2626",
  empty: "#E3DDD1",
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type Style = Record<string, string | number>;

/** Turns `{ fontSize: "12px" }` into `font-size: 12px` for inline email styles. */
export const css = (style: Style): string =>
  Object.entries(style)
    .map(([property, value]) => `${property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`)
    .join("; ");

export const TABLE_ATTRS = `cellpadding="0" cellspacing="0" border="0"`;

export const EYEBROW_STYLE: Style = {
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
export const HEADING_STYLE: Style = { fontFamily: SERIF, fontWeight: 700, color: COLORS.ink };
export const BODY_STYLE: Style = { lineHeight: 1.5, color: COLORS.body };

export interface VoteSplit {
  agreePercent: number;
  disagreePercent: number;
  voteCount: number;
}

export const summarizeVoteSplit = (statement: Statement): VoteSplit => {
  const agrees = statement.agrees + statement.superAgrees;
  const voteCount = getOpinionatedVoteCount(statement);
  if (voteCount === 0) return { agreePercent: 0, disagreePercent: 0, voteCount };
  const agreePercent = Math.round((agrees / voteCount) * 100);
  return { agreePercent, disagreePercent: 100 - agreePercent, voteCount };
};

export const voteLabel = (vote: VoteType) => (vote === "disagree" ? "You disagreed" : "You agreed");
export const voteColor = (vote: VoteType) => (vote === "disagree" ? COLORS.disagree : COLORS.agree);

const MASCOT_ASPECT_RATIO = 704 / 960;

export const renderMascot = (height: number) => {
  const width = Math.round(height * MASCOT_ASPECT_RATIO);
  const style = css({ display: "block", border: 0, width: `${width}px`, height: `${height}px` });
  return `<img src="${getFrontendUrl()}/toga-monkey.png" width="${width}" height="${height}" alt="" style="${style}">`;
};

const renderBarSegment = (percent: number, color: string, height: number) => {
  if (percent === 0) return "";
  const style = css({ height: `${height}px`, backgroundColor: color, fontSize: 0, lineHeight: 0 });
  return `<td width="${percent}%" style="${style}">&nbsp;</td>`;
};

export const renderSplitBar = (split: VoteSplit, height: number) => {
  const borderRadius = `${height}px`;
  if (split.voteCount === 0) {
    const emptyStyle = css({ height: `${height}px`, borderRadius, backgroundColor: COLORS.empty });
    return `<div style="${emptyStyle}"></div>`;
  }
  const tableStyle = css({ borderCollapse: "separate", borderRadius, overflow: "hidden" });
  return `
    <table width="100%" ${TABLE_ATTRS} style="${tableStyle}">
      <tr>
        ${renderBarSegment(split.agreePercent, COLORS.agree, height)}
        ${renderBarSegment(split.disagreePercent, COLORS.disagree, height)}
      </tr>
    </table>
  `;
};

const BUTTON_STYLE: Style = {
  display: "block",
  borderRadius: "12px",
  padding: "14px 20px",
  textAlign: "center",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "15px",
};
const BUTTON_VARIANT_STYLES = {
  solid: css({ ...BUTTON_STYLE, backgroundColor: COLORS.button, color: COLORS.card, border: `2px solid ${COLORS.button}` }),
  outline: css({ ...BUTTON_STYLE, backgroundColor: COLORS.card, color: COLORS.ink, border: `2px solid ${COLORS.border}` }),
};

export const renderButton = (href: string, label: string, variant: keyof typeof BUTTON_VARIANT_STYLES) =>
  `<a href="${href}" style="${BUTTON_VARIANT_STYLES[variant]}">${escapeHtml(label)}</a>`;

const FOOTER_STYLE = css({ padding: "20px 24px 32px", textAlign: "center", fontSize: "12px", color: COLORS.muted });
const FOOTER_PLACE_STYLE = css({ margin: "0 0 6px" });
const FOOTER_LINK_STYLE = css({ color: COLORS.muted, textDecoration: "underline" });

const renderFooter = (userId: string) => `
  <div style="${FOOTER_STYLE}">
    <p style="${FOOTER_PLACE_STYLE}">Heard · Washington, DC</p>
    <a href="${getFrontendUrl()}/unsubscribe?userId=${userId}" style="${FOOTER_LINK_STYLE}">Unsubscribe</a>
  </div>
`;

const PAGE_STYLE = css({ margin: 0, padding: 0, backgroundColor: COLORS.page, fontFamily: SANS });
const COLUMN_STYLE = css({ maxWidth: "480px", margin: "0 auto", padding: "24px 16px 0" });
const CARD_STYLE = css({ backgroundColor: COLORS.card, borderRadius: "16px", padding: "28px 24px" });

export const renderDocument = (title: string, content: string, userId: string) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="${PAGE_STYLE}">
    <div style="${COLUMN_STYLE}">
      <div style="${CARD_STYLE}">
        ${content}
      </div>
      ${renderFooter(userId)}
    </div>
  </body>
  </html>
`;
