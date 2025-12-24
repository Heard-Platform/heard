// @ts-ignore
import { toast } from "sonner@2.0.3";

import { useState } from "react";
import { Button } from "../components/ui/button";
import { CreateRoomSheet } from "../components/CreateRoomSheet";
import { ShareDebateStep } from "../components/create-room/ShareDebateStep";
import { ReviewExtractionStep } from "../components/create-room/ReviewExtractionStep";
import { Card } from "../components/ui/card";
import { Toaster } from "../components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ONE_WEEK_MIN } from "../utils/time";
    
const mockTopic = "Should we close Q Street during farmers market?";
const mockStatements = [
  "Closing Q Street during farmers market creates a vibrant community space that brings neighbors together",
  "Traffic diversions hurt local businesses on surrounding streets - we need better solutions",
  "The farmers market is a weekly tradition that deserves priority over car convenience",
];

export function CreateRoomSheetStory() {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultSubHeard, setDefaultSubHeard] = useState<string | undefined>(undefined);
  const [defaultTopic, setDefaultTopic] = useState<string | undefined>(undefined);
  
  const [reviewTopic, setReviewTopic] = useState(mockTopic);
  const [reviewStatements, setReviewStatements] = useState(mockStatements);
  const [reviewDebateLength, setReviewDebateLength] = useState(ONE_WEEK_MIN);
  const [reviewAllowAnonymous, setReviewAllowAnonymous] = useState(false);

  const handleCreateRoom = async (
    topic: string,
    mode: "realtime" | "host-controlled",
    rantFirst?: boolean,
    description?: string,
    subHeard?: string,
    seedStatements?: string[]
  ) => {
    // Mock create room function
    console.log("Creating room:", {
      topic,
      mode,
      rantFirst,
      description,
      subHeard,
      seedStatements,
    });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success(`Debate created: "${topic}"`);
    
    // Return mock room data with ID
    return {
      id: `mock-room-${Date.now()}`,
      topic: topic,
    };
  };

  const handleExtractTopicAndStatements = async (rant: string) => {
    // Mock extraction function - simulates OpenAI extraction
    console.log("Extracting from rant:", rant);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock extraction
    return {
      topic: mockTopic,
      statements: mockStatements,
    };
  };

  return (
    <Tabs defaultValue="full-flow" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="full-flow">Full Flow</TabsTrigger>
        <TabsTrigger value="share-step">Share Step Only</TabsTrigger>
        <TabsTrigger value="review-step">Review Step Only</TabsTrigger>
      </TabsList>

      <TabsContent value="full-flow" className="space-y-6">
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

        {/* The actual drawer */}
        <CreateRoomSheet
          open={isOpen}
          userId="story-user-123"
          onOpenChange={setIsOpen}
          onCreateRoom={handleCreateRoom}
          onExtractTopicAndStatements={handleExtractTopicAndStatements}
          defaultSubHeard={defaultSubHeard}
          defaultTopic={defaultTopic}
        />
      </TabsContent>

      <TabsContent value="share-step" className="space-y-6">
        <Card className="p-6 bg-white">
          <h2 className="text-xl mb-4 text-slate-900">Share Debate Step</h2>
          <p className="text-sm text-slate-600 mb-6">
            Test the final share step that appears after creating a debate.
          </p>
        </Card>

        {/* Preview in a container that simulates the drawer */}
        <div className="max-w-md mx-auto">
          <Card className="p-6 bg-white">
            <ShareDebateStep
              debateId="mock-debate-12345"
              topic="Should pineapple be allowed on pizza?"
            />
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="review-step" className="space-y-6">
        <Card className="p-6 bg-white">
          <ReviewExtractionStep
            topic={reviewTopic}
            statements={reviewStatements}
            debateLength={reviewDebateLength}
            allowAnonymousVoting={reviewAllowAnonymous}
            onTopicChange={setReviewTopic}
            onStatementsChange={setReviewStatements}
            onDebateLengthChange={setReviewDebateLength}
            onAllowAnonymousVotingChange={setReviewAllowAnonymous}
          />
        </Card>
      </TabsContent>

      <Toaster />
    </Tabs>
  );
}