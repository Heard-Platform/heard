import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import type { FlyerStatementOption } from "../../../utils/dev-api";

interface StatementPickerProps {
  statements: FlyerStatementOption[];
  selectedStatementId: string | null;
  onChange: (statementId: string) => void;
}

export function StatementPicker({ statements, selectedStatementId, onChange }: StatementPickerProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor="flyer-sensors-statement">Statement on the new flyers</Label>
      <Select value={selectedStatementId ?? undefined} onValueChange={onChange} disabled={statements.length === 0}>
        <SelectTrigger id="flyer-sensors-statement" className="w-full">
          <SelectValue placeholder={statements.length === 0 ? "This room has no statements" : "Select a statement"} />
        </SelectTrigger>
        <SelectContent>
          {statements.map((statement) => (
            <SelectItem key={statement.id} value={statement.id}>
              <span className="truncate">{statement.text}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
