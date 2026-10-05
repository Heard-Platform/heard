import { Context, Hono } from "npm:hono";
import { API_URL_PREFIX } from "./constants.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { getUserOrThrow } from "./kv-utils.tsx";
import { setInternalVar, throwIfNotFound } from "./model-utils.ts";
import { EMAIL_JOBS, isScheduleOn } from "./email-jobs.ts";

const app = new Hono();

const getJob = (jobId: string) => throwIfNotFound(EMAIL_JOBS[jobId], `Email job "${jobId}"`);

app.get(
  `${API_URL_PREFIX}/admin/email-jobs`,
  defineRoute(
    {},
    async () => ({
      jobs: await Promise.all(
        Object.entries(EMAIL_JOBS).map(async ([id, job]) => ({
          id,
          label: job.label,
          isScheduleOn: await isScheduleOn(job),
        })),
      ),
    }),
    "Failed to list email jobs",
  ),
);

app.post(
  `${API_URL_PREFIX}/admin/email-jobs/:jobId/schedule`,
  defineRoute(
    { jobId: { type: "string", required: true }, isOn: { type: "boolean", required: true } },
    async ({ jobId, isOn }: { jobId: string; isOn: boolean }) => {
      await setInternalVar(getJob(jobId).scheduleSwitch, isOn);
      return { isScheduleOn: isOn };
    },
    "Failed to update email job schedule",
  ),
);

app.post(
  `${API_URL_PREFIX}/admin/email-jobs/:jobId/dry-run`,
  defineRoute(
    { jobId: { type: "string", required: true } },
    async ({ jobId }: { jobId: string }) => getJob(jobId).dryRun(),
    "Failed to dry-run email job",
  ),
);

app.post(
  `${API_URL_PREFIX}/admin/email-jobs/:jobId/run`,
  defineRoute(
    { jobId: { type: "string", required: true } },
    async ({ jobId }: { jobId: string }) => getJob(jobId).run(),
    "Failed to run email job",
  ),
);

app.post(
  `${API_URL_PREFIX}/admin/email-jobs/:jobId/run-for-me`,
  defineRoute(
    { jobId: { type: "string", required: true } },
    async ({ jobId }: { jobId: string }, c: Context) => {
      const user = await getUserOrThrow(c.get("userId"));
      if (!user.email) throw new Error("Your account has no email address");
      await getJob(jobId).runForUser({ ...user, email: user.email });
      return { email: user.email };
    },
    "Failed to run email job for you",
  ),
);

export { app as adminEmailJobsApi };
