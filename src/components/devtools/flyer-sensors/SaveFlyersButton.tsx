import { useState } from "react";
import { Button } from "../../ui/button";
import { formatClockTime } from "./format";

type SaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; savedAtMs: number }
  | { state: "error"; message: string };

interface SaveFlyersButtonProps {
  disabledReason: string | null;
  onSave: () => Promise<void>;
}

function describeStatus(status: SaveStatus): string | null {
  switch (status.state) {
    case "idle":
      return null;
    case "saving":
      return "Saving…";
    case "saved":
      return `Saved at ${formatClockTime(status.savedAtMs)}`;
    case "error":
      return status.message;
  }
}

export function SaveFlyersButton({ disabledReason, onSave }: SaveFlyersButtonProps) {
  const [status, setStatus] = useState<SaveStatus>({ state: "idle" });

  const handleClick = async () => {
    setStatus({ state: "saving" });
    try {
      await onSave();
      setStatus({ state: "saved", savedAtMs: Date.now() });
    } catch (error) {
      setStatus({ state: "error", message: error instanceof Error ? error.message : "Failed to save" });
    }
  };

  const message = disabledReason ?? describeStatus(status);

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleClick} disabled={disabledReason !== null || status.state === "saving"}>
        Save flyers
      </Button>
      {message && (
        <span className={`text-sm ${status.state === "error" && !disabledReason ? "text-red-600" : "text-slate-500"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
