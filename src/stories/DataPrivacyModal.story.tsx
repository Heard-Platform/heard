import { useState } from "react";
import { DataPrivacyModal } from "../components/room/DataPrivacyModal";
import { Button } from "../components/ui/button";

export function DataPrivacyModalStory() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");

  const handleDecline = () => {
    setLastAction("User declined to share data");
    console.log("User declined to share");
  };

  const handleAccept = () => {
    setLastAction("User is willing to share data");
    console.log("User willing to share");
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Data Privacy Modal</h1>
          <p className="text-muted-foreground">
            Modal shown when users click "I prefer not to say" on demographics questions
          </p>
        </div>

        <Button onClick={() => setIsOpen(true)} size="lg">
          Open Privacy Explanation
        </Button>

        {lastAction && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Last Action:</p>
            <p className="text-sm text-muted-foreground">{lastAction}</p>
          </div>
        )}

        <DataPrivacyModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onDeclineToShare={handleDecline}
          onWillingToShare={handleAccept}
          youtubeVideoId="dQw4w9WgXcQ"
        />
      </div>
    </div>
  );
}
