import { useState } from "react";
import { IntroModal } from "../components/IntroModal";
import { Button } from "../components/ui/button";

export function IntroModalStory() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Intro Modal</h2>
        <p className="text-slate-600">
          Welcome modal with animated demo showing users how to swipe on statements.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <Button onClick={() => setIsOpen(true)}>
          Open Intro Modal
        </Button>

        <IntroModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
    </div>
  );
}
