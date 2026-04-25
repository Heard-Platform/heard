import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DialogTitle } from "../../ui/dialog";

export function HideAndMergeHeader() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="px-6 pt-6 pb-4 border-b">
      <DialogTitle className="text-base font-semibold">Hide & Merge Statements</DialogTitle>
      <p className="text-sm text-muted-foreground mt-1">
        Hide harmful responses or merge duplicate statements.
      </p>
      <button
        className="flex items-center gap-1 text-xs text-muted-foreground mt-1"
        onClick={() => setShowHelp((v) => !v)}
      >
        {showHelp ? "Show less" : "Learn more"}
        {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {showHelp && (
        <p className="text-sm text-muted-foreground mt-1">
          Hidden responses don't appear to anyone — not in voting, results, or analysis.
          Hiding is reversible. To merge duplicates, tap a duplicate statement and then
          the canonical one to keep. Votes are combined at analysis time and no data is
          deleted; merges and hides can be undone here.
        </p>
      )}
    </div>
  );
}
