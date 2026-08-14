import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { formatSubHeardDisplay } from "../../utils/subheard";

export interface ScriptField {
  key: string;
  placeholder: string;
  required?: boolean;
  options?: string[];
}

interface ScriptMultiSelectFieldProps {
  scriptId: string;
  field: ScriptField;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

function ScriptMultiSelectField({
  scriptId,
  field,
  value,
  disabled,
  onChange,
}: ScriptMultiSelectFieldProps) {
  const options = field.options ?? [];
  const selected = new Set(value.split(",").map(s => s.trim()).filter(Boolean));

  const toggleOption = (option: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(option);
    else next.delete(option);
    onChange(Array.from(next).join(","));
  };

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{field.placeholder}</div>
      <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-white">
        {options.length === 0 ? (
          <div className="text-xs text-muted-foreground">No communities found</div>
        ) : (
          options.map(option => (
            <div key={option} className="flex items-center gap-2 py-0.5">
              <Checkbox
                id={`script-field-${scriptId}-${field.key}-${option}`}
                checked={selected.has(option)}
                disabled={disabled}
                onCheckedChange={(v: boolean) => toggleOption(option, v)}
              />
              <Label
                htmlFor={`script-field-${scriptId}-${field.key}-${option}`}
                className="text-sm font-normal cursor-pointer"
              >
                {formatSubHeardDisplay(option)}
              </Label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface ScriptFieldListProps {
  scriptId: string;
  fields: ScriptField[];
  values: Record<string, string>;
  disabled: boolean;
  onChange: (key: string, value: string) => void;
}

export function ScriptFieldList({
  scriptId,
  fields,
  values,
  disabled,
  onChange,
}: ScriptFieldListProps) {
  return (
    <div className="flex flex-col gap-2 mt-3">
      {fields.map(field => {
        const currentValue = values[field.key] || "";

        if (field.options) {
          return (
            <ScriptMultiSelectField
              key={field.key}
              scriptId={scriptId}
              field={field}
              value={currentValue}
              disabled={disabled}
              onChange={(value) => onChange(field.key, value)}
            />
          );
        }

        return (
          <Input
            key={field.key}
            value={currentValue}
            placeholder={field.placeholder}
            disabled={disabled}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        );
      })}
    </div>
  );
}
