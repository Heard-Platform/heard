import { ChevronDown, ChevronUp } from "lucide-react";

interface ShowNumbersToggleProps {
  showNumbers: boolean;
  onShowNumbersChange: (show: boolean) => void;
}

export function ShowNumbersToggle({ showNumbers, onShowNumbersChange }: ShowNumbersToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onShowNumbersChange(!showNumbers)}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {showNumbers ? (
        <>
          <ChevronUp className="w-3 h-3" />
          Hide numbers
        </>
      ) : (
        <>
          <ChevronDown className="w-3 h-3" />
          Show numbers
        </>
      )}
    </button>
  );
}
