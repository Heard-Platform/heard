export const EMAIL_PRIORITY = {
  LOW: 3,
  MID: 5,
  HIGH: 8,
} as const;

export type EmailType =
  | "post_ended"
  | "response_highest_agreed"
  | "response_getting_traction"
  | "post_trending"
  | "new_response_on_post";

export type QueueRowStatus = "pending" | "processing" | "sent" | "failed";

export interface EmailQueueRow {
  id: string;
  userId: string;
  emailType: EmailType;
  // Higher = more interesting. Used to pick subject line and resolve conflicts.
  priority: number;
  // Which post this notification is about. Used to deduplicate per post.
  postId: string;
  data: Record<string, unknown>;
  status: QueueRowStatus;
  createdAt: string;
}

export interface CondensedItem {
  emailType: EmailType;
  postId: string;
  priority: number;
  data: Record<string, unknown>;
  // How many additional items of this type were collapsed ("and N others")
  othersCount: number;
}

export interface CondensedUserEmail {
  userId: string;
  subject: string;
  items: CondensedItem[];
  // Original row IDs to mark as processing then sent
  rowIds: string[];
}

export interface ProcessQueueResult {
  usersToProcess: string[];
  rowsToMark: EmailQueueRow[];
  condensed: CondensedUserEmail[];
}
