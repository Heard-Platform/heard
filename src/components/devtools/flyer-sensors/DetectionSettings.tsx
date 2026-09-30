import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import type { TapDetectionParams } from "./tap-detection";

export interface DetectionSettingsValue extends TapDetectionParams {
  standingWindowMs: number;
}

interface DetectionSettingsProps {
  value: DetectionSettingsValue;
  onChange: (value: DetectionSettingsValue) => void;
}

interface NumberFieldConfig {
  key: keyof DetectionSettingsValue;
  label: string;
  step: number;
}

const FIELDS: NumberFieldConfig[] = [
  { key: "minPeakMagnitude", label: "Tap threshold (m/s²)", step: 1 },
  { key: "tapsPerSignal", label: "Taps per flyer", step: 1 },
  { key: "maxTapGapMs", label: "Max gap between taps (ms)", step: 50 },
  { key: "minTapSpacingMs", label: "Min tap spacing (ms)", step: 10 },
  { key: "standingWindowMs", label: "GPS averaging window (ms)", step: 1000 },
];

export function DetectionSettings({ value, onChange }: DetectionSettingsProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
        Detection settings
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={`flyer-sensors-${field.key}`} className="text-xs text-slate-600">
                {field.label}
              </Label>
              <Input
                id={`flyer-sensors-${field.key}`}
                type="number"
                min={0}
                step={field.step}
                value={value[field.key]}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  if (Number.isFinite(parsed)) onChange({ ...value, [field.key]: parsed });
                }}
              />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
