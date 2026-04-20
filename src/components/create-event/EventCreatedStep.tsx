import { Check } from "lucide-react";

interface EventCreatedStepProps {
  eventName: string;
}

export function EventCreatedStep({ eventName }: EventCreatedStepProps) {
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
          Your event is live. Now add your first conversation to get things started.
        </p>
      </div>
    </div>
  );
}
