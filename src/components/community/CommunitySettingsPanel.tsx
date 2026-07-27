import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useTranslation } from "react-i18next";
import type { SubHeard } from "../../types";

interface SettingConfig {
  id: string;
  label: string;
  description: string;
  key: keyof Pick<SubHeard, 'isPrivate' | 'hostOnlyPosting'>;
}

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
  const { t } = useTranslation("community");
  const SETTINGS: SettingConfig[] = [
    {
      id: "privacy-toggle",
      label: t("unlistedCommunity"),
      description: t("unlistedDesc"),
      key: "isPrivate",
    },
    {
      id: "posting-permissions-toggle",
      label: t("modOnlyPosting"),
      description: t("modOnlyDesc"),
      key: "hostOnlyPosting",
    },
  ];
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
