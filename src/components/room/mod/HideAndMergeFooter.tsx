import { Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Statement } from "../../../types";

interface HideAndMergeFooterProps {
  source: Statement | null;
  target: Statement | null;
  submitting: boolean;
  onClearSelection: () => void;
  onConfirmMerge: () => void;
  onClose: () => void;
}

export function HideAndMergeFooter({
  source,
  target,
  submitting,
  onClearSelection,
  onConfirmMerge,
  onClose,
}: HideAndMergeFooterProps) {
  const prompt = !source
    ? "Select a duplicate to merge, or hide a response."
    : !target
    ? "Now tap the statement you want to keep."
    : null;

  const confirmText = source && target
    ? `Merge "${source.text.slice(0, 50)}${source.text.length > 50 ? "…" : ""}" into "${target.text.slice(0, 50)}${target.text.length > 50 ? "…" : ""}"?`
    : null;

  return (
    <div className="border-t px-4 py-3 space-y-2">
      {prompt && !confirmText && (
        <p className="text-sm text-muted-foreground">{prompt}</p>
      )}
      {confirmText && (
        <p className="text-sm text-muted-foreground">{confirmText}</p>
      )}
      <div className="flex justify-end gap-2">
        {source && (
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear selection
          </Button>
        )}
        {source && target && (
          <Button size="sm" onClick={onConfirmMerge} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Merge
          </Button>
        )}
        {!source && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
