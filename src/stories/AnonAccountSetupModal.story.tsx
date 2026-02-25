import { useState } from "react";
import { AnonAccountSetupModal } from "../components/AnonAccountSetupModal";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function AnonAccountSetupModalStory() {
  const [isOpen, setIsOpen] = useState(false);
  const [featureText, setFeatureText] = useState("start a conversation");

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <Button
          variant="outline"
          onClick={() => {
            setFeatureText("start a conversation");
            setIsOpen(true);
          }}
          className="justify-start"
        >
          Open Modal
        </Button>
      </Card>

      <AnonAccountSetupModal
        featureText={featureText}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
