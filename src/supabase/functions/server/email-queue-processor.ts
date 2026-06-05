import type {
  CondensedItem,
  CondensedUserEmail,
  EmailQueueRow,
  EmailType,
  ProcessQueueResult,
} from "./email-queue-types.ts";

export const DEFAULT_DAILY_LIMIT = 3;
export const DEFAULT_MAX_USERS_PER_RUN = 50;

export function processEmailQueue(
  pendingRows: EmailQueueRow[],
  sentCountsByUser: Record<string, number>,
  options?: { dailyLimit?: number; maxUsersPerRun?: number },
): ProcessQueueResult {
  const dailyLimit = options?.dailyLimit ?? DEFAULT_DAILY_LIMIT;
  const maxUsersPerRun = options?.maxUsersPerRun ?? DEFAULT_MAX_USERS_PER_RUN;

  const eligible = filterUsersAtLimit(pendingRows, sentCountsByUser, dailyLimit);
  const allUserIds = [...new Set(eligible.map((r) => r.userId))];
  const userIds = allUserIds.slice(0, maxUsersPerRun);
  const rowsToMark = getRowsForUsers(eligible, userIds);
  const grouped = groupRowsByUser(rowsToMark);
  const condensed = userIds.map((uid) =>
    condenseRowsForUser(uid, grouped[uid] ?? [])
  );

  return { usersToProcess: userIds, rowsToMark, condensed };
}

export function filterUsersAtLimit(
  rows: EmailQueueRow[],
  sentCountsByUser: Record<string, number>,
  dailyLimit: number = DEFAULT_DAILY_LIMIT,
): EmailQueueRow[] {
  return rows.filter((row) => (sentCountsByUser[row.userId] ?? 0) < dailyLimit);
}

export function getRowsForUsers(
  rows: EmailQueueRow[],
  userIds: string[],
): EmailQueueRow[] {
  const idSet = new Set(userIds);
  return rows.filter((row) => idSet.has(row.userId));
}

export function groupRowsByUser(
  rows: EmailQueueRow[],
): Record<string, EmailQueueRow[]> {
  const groups: Record<string, EmailQueueRow[]> = {};
  for (const row of rows) {
    if (!groups[row.userId]) groups[row.userId] = [];
    groups[row.userId].push(row);
  }
  return groups;
}

export function condenseRowsForUser(
  userId: string,
  rows: EmailQueueRow[],
): CondensedUserEmail {
  const deduplicated = deduplicateByPost(rows);
  const items = condenseByType(deduplicated);
  const subject = pickSubjectLine(items);
  return {
    userId,
    subject,
    items,
    rowIds: rows.map((r) => r.id),
  };
}

export function deduplicateByPost(rows: EmailQueueRow[]): EmailQueueRow[] {
  const best = new Map<string, EmailQueueRow>();
  for (const row of rows) {
    const existing = best.get(row.postId);
    if (!existing || row.priority > existing.priority) {
      best.set(row.postId, row);
    }
  }
  return Array.from(best.values());
}

export function condenseByType(rows: EmailQueueRow[]): CondensedItem[] {
  const byType = new Map<EmailType, EmailQueueRow[]>();
  for (const row of rows) {
    if (!byType.has(row.emailType)) byType.set(row.emailType, []);
    byType.get(row.emailType)!.push(row);
  }

  return Array.from(byType.entries()).map(([emailType, typeRows]) => {
    const sorted = [...typeRows].sort((a, b) => b.priority - a.priority);
    const top = sorted[0];
    return {
      emailType,
      postId: top.postId,
      priority: top.priority,
      data: top.data,
      othersCount: sorted.length - 1,
    };
  });
}

export function pickSubjectLine(items: CondensedItem[]): string {
  if (items.length === 0) return "New activity on Heard";
  const top = [...items].sort((a, b) => b.priority - a.priority)[0];
  return subjectForItem(top);
}

export function subjectForItem(item: CondensedItem): string {
  const title = item.data.postTitle as string | undefined;
  switch (item.emailType) {
    case "response_highest_agreed":
      return "Your response is the highest agreed!";
    case "post_ended":
      return title ? `"${title}" has ended` : "A post you follow has ended";
    case "response_getting_traction":
      return "Your response is getting traction";
    case "post_trending":
      return title ? `"${title}" is trending` : "A post is trending";
    case "new_response_on_post":
      return title
        ? `New responses on "${title}"`
        : "New responses on your post";
    default:
      return "New activity on Heard";
  }
}