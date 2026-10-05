import {
  type EmailableUser,
  type RecipientStep,
  getRecipientsAndSteps,
  sendFlyerResultsEmails,
  sendTestFlyerResultsEmail,
} from "./service-flyer-results-email.ts";
import { FLYER_RESULTS_EMAIL_TYPE } from "./template-flyer-results.ts";
import { getInternalVar } from "./model-utils.ts";
import { InternalVarKey } from "./types.tsx";

export interface EmailJobRecipient {
  userId: string;
  email: string;
}

export interface EmailJobDryRun {
  recipients: EmailJobRecipient[];
  steps: RecipientStep[];
}

/** An email that can be sent out by hand from the admin panel. */
export interface EmailJob {
  label: string;
  /** Turns the job's scheduled runs on or off. Off until it's first turned on. */
  scheduleSwitch: InternalVarKey;
  dryRun: () => Promise<EmailJobDryRun>;
  run: () => Promise<{ sent: number }>;
  runForUser: (user: EmailableUser) => Promise<void>;
}

export const EMAIL_JOBS: Record<string, EmailJob> = {
  [FLYER_RESULTS_EMAIL_TYPE]: {
    label: "Waymo flyer results",
    scheduleSwitch: InternalVarKey.FLYER_RESULTS_MAILER_ON,
    dryRun: async () => {
      const { recipients, steps } = await getRecipientsAndSteps(Date.now());
      return { recipients: recipients.map(({ user }) => ({ userId: user.id, email: user.email })), steps };
    },
    run: () => sendFlyerResultsEmails(Date.now()),
    runForUser: sendTestFlyerResultsEmail,
  },
};

export const isScheduleOn = async (job: EmailJob): Promise<boolean> =>
  (await getInternalVar<boolean>(job.scheduleSwitch)) === true;
