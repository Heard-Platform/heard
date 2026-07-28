import { Label } from "../ui/label";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FunSheetCard } from "../FunSheet";

interface EventDetailsStepProps {
  name: string;
  subtitle: string;
  showError: boolean;
  onNameChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
}

function Field({
  id,
  label,
  required,
  value,
  placeholder,
  maxLength,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm text-slate-600">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

export function EventDetailsStep({
  name,
  subtitle,
  onNameChange,
  onSubtitleChange,
  showError,
}: EventDetailsStepProps) {
  const { t } = useTranslation("create");
  return (
    <FunSheetCard delay={0.1}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-orange-600" />
          <Label className="text-base text-slate-700">{t("ceEventDetails")}</Label>
        </div>

        <Field
          id="event-name"
          label={t("ceNameLabel")}
          required
          value={name}
          placeholder={t("ceNamePlaceholder")}
          maxLength={100}
          onChange={onNameChange}
        />

        <Field
          id="event-subtitle"
          label={t("ceSubtitleLabel")}
          value={subtitle}
          placeholder={t("ceSubtitlePlaceholder")}
          maxLength={200}
          onChange={onSubtitleChange}
        />

        {showError && (
          <p className="text-sm text-red-500">
            {t("ceNameError")}
          </p>
        )}
      </div>
    </FunSheetCard>
  );
}
