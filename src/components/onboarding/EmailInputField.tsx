import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface EmailInputFieldProps {
  value: string;
  id?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

export function EmailInputField({
  value,
  id = "email",
  label = "Email",
  helperText,
  disabled,
  autoFocus,
  onChange,
}: EmailInputFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Input
        id={id}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="you@example.com"
        disabled={disabled}
        autoFocus={autoFocus}
        className="bg-white dark:bg-gray-900"
      />
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
