import { useState } from "react";
import { Button } from "../components/ui/button";
import { CreateRoomSheet } from "../components/CreateRoomSheet";
import { Card } from "../components/ui/card";
import { toast } from "sonner@2.0.3";
import { Toaster } from "../components/ui/sonner";

export function CreateRoomSheetStory() {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultSubHeard, setDefaultSubHeard] = useState<string | undefined>(undefined);
  const [defaultTopic, setDefaultTopic] = useState<string | undefined>(undefined);

  const handleCreateRoom = async (
    topic: string,
    mode: "realtime" | "host-controlled",
    rantFirst?: boolean,
    description?: string,
    subHeard?: string
  ) => {
    // Mock create room function
    console.log("Creating room:", {
      topic,
      mode,
      rantFirst,
      description,
      subHeard,
    });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success(`Debate created: "${topic}"`);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white">
        <h2 className="text-xl mb-4 text-slate-900">Create Debate Drawer</h2>
        <p className="text-sm text-slate-600 mb-6">
          Test the new debate creation drawer with different states and configurations.
        </p>

        <div className="space-y-4">
          {/* Basic Open */}
          <div className="space-y-2">
            <h3 className="text-sm text-slate-700">Basic Usage</h3>
            <Button onClick={() => setIsOpen(true)}>
              Open Create Debate Drawer
            </Button>
          </div>

          {/* With Default Sub-Heard */}
          <div className="space-y-2">
            <h3 className="text-sm text-slate-700">With Default Community</h3>
            <Button
              variant="outline"
              onClick={() => {
                setDefaultSubHeard("dupont-circle-neighborhoods");
                setDefaultTopic(undefined);
                setIsOpen(true);
              }}
            >
              Open with "Dupont Circle Neighborhoods"
            </Button>
          </div>

          {/* With Default Topic */}
          <div className="space-y-2">
            <h3 className="text-sm text-slate-700">With Pre-filled Topic</h3>
            <Button
              variant="outline"
              onClick={() => {
                setDefaultSubHeard(undefined);
                setDefaultTopic("Should pineapple be allowed on pizza?");
                setIsOpen(true);
              }}
            >
              Open with Pre-filled Topic
            </Button>
          </div>

          {/* With Both Defaults */}
          <div className="space-y-2">
            <h3 className="text-sm text-slate-700">With Both Pre-filled</h3>
            <Button
              variant="outline"
              onClick={() => {
                setDefaultSubHeard("general-discussion");
                setDefaultTopic("Remote work vs. office work");
                setIsOpen(true);
              }}
            >
              Open with Community + Topic
            </Button>
          </div>
        </div>
      </Card>

      {/* Implementation Notes */}
      <Card className="p-6 bg-slate-50 border-slate-200">
        <h3 className="text-sm text-slate-700 mb-3">Implementation Notes</h3>
        <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
          <li>Always uses realtime mode with rant-first enabled</li>
          <li>Fetches available communities from the API</li>
          <li>Supports creating new communities on the fly</li>
          <li>Topic must be at least 10 characters</li>
          <li>Description is optional (max 2000 chars)</li>
          <li>Shows example topics to inspire users</li>
          <li>Uses the FunSheet wrapper for consistent styling</li>
        </ul>
      </Card>

      {/* The actual drawer */}
      <CreateRoomSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        onCreateRoom={handleCreateRoom}
        defaultSubHeard={defaultSubHeard}
        defaultTopic={defaultTopic}
      />

      <Toaster />
    </div>
  );
}
