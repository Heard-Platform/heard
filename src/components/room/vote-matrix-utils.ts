import { Statement, StatementMerge, VoteType } from "../../types";

export type VoteMatrixData = {
  statements: Statement[];
  merges: StatementMerge[];
  phoneVerified?: Record<string, boolean>;
  userClusters?: Record<string, number>;
};

const CSV_VOTE_LABELS: Record<VoteType, string> = {
  agree: "agree",
  super_agree: "super_agree",
  disagree: "disagree",
  pass: "pass",
};

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function getMatrixUserIds(statements: Statement[]): string[] {
  return Array.from(
    new Set(
      statements.flatMap((s) => [s.author, ...Object.keys(s.voters ?? {})]),
    ),
  ).sort();
}

export function buildVoteMatrixCsv(data: VoteMatrixData): string {
  const { statements, userClusters = {} } = data;
  const userIds = getMatrixUserIds(statements);
  const userLabels = userIds.map((_, i) => String(i + 1));
  const rows: string[] = [];

  rows.push(["Statement", "A", "D", "P", ...userLabels].map(csvEscape).join(","));

  if (Object.keys(userClusters).length > 0) {
    rows.push(
      [
        "Cluster",
        "",
        "",
        "",
        ...userIds.map((uid) =>
          userClusters[uid] !== undefined ? String(userClusters[uid]) : "",
        ),
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  statements.forEach((stmt, i) => {
    const idx = i + 1;
    rows.push(
      [
        `${idx}. ${stmt.text}`,
        stmt.agrees + stmt.superAgrees,
        stmt.disagrees,
        stmt.passes,
        ...userIds.map((uid) => {
          const vote = stmt.voters?.[uid];
          const label = vote ? CSV_VOTE_LABELS[vote] : "";
          if (uid !== stmt.author) return label;
          return label ? `${label} (author)` : "(author)";
        }),
      ]
        .map(csvEscape)
        .join(","),
    );
  });

  return rows.join("\n");
}

export function downloadVoteMatrixCsv(
  data: VoteMatrixData,
  filename = "vote-matrix.csv",
): void {
  const csv = buildVoteMatrixCsv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
