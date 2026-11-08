import { Checkbox } from "../ui/checkbox";

interface SettingCheckboxProps {
  id: string;
  title: string;
  description: string;
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
}

export function SettingCheckbox({
  id,
  title,
  description,
  isChecked,
  onCheckedChange,
}: SettingCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-xl border inactive-border px-3 py-2.5"
    >
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-foreground">
          {title}
        </span>
        <span className="text-[13px] leading-snug secondary-text-strong">
          {description}
        </span>
      </span>
      <Checkbox
        id={id}
        checked={isChecked}
        onCheckedChange={onCheckedChange}
        className="size-5"
      />
    </label>
  );
}
