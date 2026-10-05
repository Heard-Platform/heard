import { useEffect, useState } from "react";
import { Mail, Send, TestTube, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { adminApi, type EmailJobSummary } from "../../utils/admin-api";

interface EmailJobsProps {
  adminKey: string;
}

type Action = "schedule" | "dry-run" | "run-for-me" | "run";

export function EmailJobs({ adminKey }: EmailJobsProps) {
  const [jobs, setJobs] = useState<EmailJobSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<{ userId: string; email: string }[] | null>(null);
  const [runningAction, setRunningAction] = useState<Action | null>(null);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;

  useEffect(() => {
    const loadJobs = async () => {
      const response = await adminApi.getEmailJobs(adminKey);
      if (response.success && response.data) {
        setJobs(response.data.jobs);
        setSelectedJobId((current) => current ?? response.data!.jobs[0]?.id ?? null);
      } else {
        alert(`Failed to load email jobs: ${response.error || "Unknown error"}`);
      }
    };
    loadJobs();
  }, [adminKey]);

  const selectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setRecipients(null);
  };

  const withAction = async (action: Action, request: () => Promise<void>) => {
    setRunningAction(action);
    try {
      await request();
    } finally {
      setRunningAction(null);
    }
  };

  const toggleSchedule = (isOn: boolean) =>
    withAction("schedule", async () => {
      const response = await adminApi.setEmailJobSchedule(adminKey, selectedJob!.id, isOn);
      if (!response.success) {
        alert(`Failed to update schedule: ${response.error || "Unknown error"}`);
        return;
      }
      setJobs((current) => current.map((job) => (job.id === selectedJob!.id ? { ...job, isScheduleOn: isOn } : job)));
    });

  const dryRun = () =>
    withAction("dry-run", async () => {
      const response = await adminApi.dryRunEmailJob(adminKey, selectedJob!.id);
      if (response.success && response.data) {
        setRecipients(response.data.recipients);
      } else {
        alert(`Dry run failed: ${response.error || "Unknown error"}`);
      }
    });

  const runForMe = () =>
    withAction("run-for-me", async () => {
      const response = await adminApi.runEmailJobForMe(adminKey, selectedJob!.id);
      alert(
        response.success && response.data
          ? `Ran it just for you: sent to ${response.data.email}. It isn't recorded, so you can run it again.`
          : `Run for me failed: ${response.error || "Unknown error"}`,
      );
    });

  const runJob = () => {
    const audience = recipients ? `${recipients.length} users` : "everyone currently eligible (run a dry run to see who)";
    if (!confirm(`Run "${selectedJob!.label}" and email ${audience}?`)) return;

    withAction("run", async () => {
      const response = await adminApi.runEmailJob(adminKey, selectedJob!.id);
      alert(
        response.success && response.data
          ? `Sent ${response.data.sent} emails.`
          : `Send failed: ${response.error || "Unknown error"}`,
      );
      setRecipients(null);
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl">Email Jobs</h2>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="emailJobSelect">Job</Label>
          <Select value={selectedJobId ?? undefined} onValueChange={selectJob}>
            <SelectTrigger id="emailJobSelect">
              <SelectValue placeholder="Loading jobs..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedJob && (
          <>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Send automatically at 7pm ET</p>
                <p className="text-sm text-muted-foreground">
                  {selectedJob.isScheduleOn ? "On: the scheduled run sends emails." : "Off: the scheduled run does nothing."}
                </p>
              </div>
              <Switch
                checked={selectedJob.isScheduleOn}
                disabled={runningAction === "schedule"}
                onCheckedChange={toggleSchedule}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={dryRun} disabled={runningAction !== null}>
                <Users className="w-4 h-4 mr-2" />
                {runningAction === "dry-run" ? "Checking..." : "Dry run"}
              </Button>
              <Button variant="outline" onClick={runForMe} disabled={runningAction !== null}>
                <TestTube className="w-4 h-4 mr-2" />
                {runningAction === "run-for-me" ? "Running..." : "Run for me"}
              </Button>
              <Button onClick={runJob} disabled={runningAction !== null}>
                <Send className="w-4 h-4 mr-2" />
                {runningAction === "run" ? "Running..." : "Run job"}
              </Button>
            </div>

            {recipients && (
              <div className="rounded-lg border p-4">
                <p className="font-medium mb-2">
                  {recipients.length} {recipients.length === 1 ? "user" : "users"} would get this email
                </p>
                {recipients.length > 0 && (
                  <ul className="max-h-64 overflow-y-auto text-sm text-muted-foreground space-y-1">
                    {recipients.map((recipient) => (
                      <li key={recipient.userId}>{recipient.email}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
