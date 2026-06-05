import { insert } from "./db-utils.ts";
import { generateId } from "./utils.tsx";
import type { User } from "./types.tsx";
import type { EmailType } from "./email-queue-types.ts";

const EMAIL_QUEUE_TABLE = "email_queue";

export interface QueueEmailParams {
  emailType: EmailType;
  priority: number;
  postId: string;
  data?: Record<string, unknown>;
}

export async function queueEmail(
  user: User,
  params: QueueEmailParams,
): Promise<void> {
  if (!user.isDeveloper) return;

  const result = await insert(EMAIL_QUEUE_TABLE, {
    id: generateId(),
    userId: user.id,
    emailType: params.emailType,
    priority: params.priority,
    postId: params.postId,
    data: params.data ?? {},
    status: "pending",
  });

  if (!result.success) {
    console.error(
      `[email-queue] Failed to queue ${params.emailType} for dev user ${user.id}: ${result.error}`,
    );
  } else {
    console.log(
      `[email-queue] Queued ${params.emailType} for dev user ${user.id} (post: ${params.postId})`,
    );
  }
}
