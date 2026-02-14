import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import type { SubHeard } from "../../types";

interface SettingConfig {
  id: string;
  label: string;
  description: string;
  key: keyof Pick<SubHeard, 'isPrivate' | 'hostOnlyPosting'>;
}

const SETTINGS: SettingConfig[] = [
  {
    id: "privacy-toggle",
    label: "Unlisted Community",
    description: "Won't appear in public list. Only people with the link can see it.",
    key: "isPrivate",
  },
  {
    id: "posting-permissions-toggle",
    label: "Host-Only Posting",
    description: "Only community hosts can create debates.",
    key: "hostOnlyPosting",
  },
];

interface CommunitySettingsPanelProps {
  community: Partial<SubHeard>;
  isUpdating: boolean;
  onChange: (updates: Partial<SubHeard>) => void;
}

export function CommunitySettingsPanel({
  community,
  isUpdating,
  onChange,
}: CommunitySettingsPanelProps) {
  return (
    <div className="space-y-6">
      {SETTINGS.map((setting) => (
        <div key={setting.id} className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor={setting.id} className="font-medium">
              {setting.label}
            </Label>
            <p className="text-xs text-muted-foreground">
              {setting.description}
            </p>
          </div>
          <Switch
            id={setting.id}
            checked={community[setting.key] || false}
            disabled={isUpdating}
            onCheckedChange={(value: boolean) => onChange({ [setting.key]: value })}
          />
        </div>
      ))}
    </div>
  );
}
