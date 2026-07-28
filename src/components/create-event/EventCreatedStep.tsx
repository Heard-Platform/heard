import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EventCreatedStepProps {
  eventName: string;
}

export function EventCreatedStep({ eventName }: EventCreatedStepProps) {
  const { t } = useTranslation("create");
  return (
    <div className="text-center space-y-3">
      <div className="w-16 h-16 created-bg rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 created-text" />
      </div>
      <div>
        <h3 className="font-semibold text-lg created-text-strong">
          {eventName}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("ceCreatedBody")}
        </p>
      </div>
    </div>
  );
}
