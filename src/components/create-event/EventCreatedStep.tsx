import { Check, MessageSquarePlus } from "lucide-react";
import { Button } from "../ui/button";

interface EventCreatedStepProps {
  eventName: string;
  onGoToEvent: () => void;
}

export function EventCreatedStep({ eventName, onGoToEvent }: EventCreatedStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-orange-900">
            {eventName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your event is live. Now add your first conversation to get things started.
          </p>
        </div>
      </div>

      <Button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
        onClick={onGoToEvent}
      >
        <MessageSquarePlus className="w-4 h-4" />
        Go to event page
      </Button>
    </div>
  );
}
