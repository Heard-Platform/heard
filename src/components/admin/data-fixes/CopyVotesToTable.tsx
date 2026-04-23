import { useState } from "react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import { adminApi } from "../../../utils/admin-api";

interface Props {
  adminKey: string;
  fetchAdminData: () => Promise<void>;
}

export function CopyVotesToTable({ adminKey, fetchAdminData }: Props) {
  const [loading, setLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  const handleRun = async () => {
    const confirmMessage = dryRun
      ? "Preview how many votes would be copied from KV store to the votes table?\n\nNo changes will be made."
      : "Copy all votes from KV store into the votes table?\n\nThis is idempotent — safe to run multiple times.";

    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const res = await adminApi.copyVotesToTable(adminKey, dryRun);
      if (res.success) {
        const d = res.data!;
        if (dryRun) {
          alert(
            `Dry run complete!\n\n` +
            `Votes in KV store: ${d.kvVoteCount}\n` +
            `Already in table: ${d.tableVoteCount}\n` +
            `Would insert: ${d.kvVoteCount - (d.tableVoteCount ?? 0)}\n\n` +
            `No changes were made.`,
          );
        } else {
          alert(
            `Done!\n\n` +
            `KV votes: ${d.kvVoteCount}\n` +
            `Inserted: ${d.insertedCount}\n` +
            `Table count: ${d.tableVoteCount}\n` +
            `Counts match: ${d.countsMatch ? "Yes" : "No — check batchErrors"}\n\n` +
            (d.batchErrors?.length ? `Errors:\n${d.batchErrors.join("\n")}` : "No errors."),
          );
          await fetchAdminData();
        }
      } else {
        alert(`Failed: ${res.error}`);
      }
    } catch (error) {
      console.error("Error copying votes to table:", error);
      alert("Failed to copy votes to table");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50">
      <div className="flex-1">
        <h3 className="font-medium">Copy Votes to Table</h3>
        <p className="text-sm text-muted-foreground">
          Copies all votes from the KV store into the <code>votes</code> table.
          Idempotent — safe to run multiple times. Includes a count check at the end.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Checkbox
            id="copy-votes-dry-run"
            checked={dryRun}
            onCheckedChange={(v: boolean) => setDryRun(v)}
            disabled={loading}
          />
          <Label htmlFor="copy-votes-dry-run" className="text-sm font-normal cursor-pointer">
            {dryRun ? "Dry Run Mode (preview only)" : "Live Mode"}
          </Label>
        </div>
      </div>
      <Button onClick={handleRun} disabled={loading} variant="outline" size="sm">
        {loading ? (dryRun ? "Checking..." : "Copying...") : dryRun ? "Run Dry Run" : "Copy Votes"}
      </Button>
    </div>
  );
}
