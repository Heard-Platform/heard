import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Toaster } from "../components/ui/sonner";
import { CreateEventSheet } from "../components/CreateEventSheet";
import { EventDetailsStep } from "../components/create-event/EventDetailsStep";
import { EventCreatedStep } from "../components/create-event/EventCreatedStep";
import { SelectCommunityStep } from "../components/create-room";
import { StoryContainer } from "./StoryContainer";

export function CreateEventSheetStory() {
  const [isOpen, setIsOpen] = useState(false);

  const [detailsName, setDetailsName] = useState("Adams Morgan Book Club");
  const [detailsSubtitle, setDetailsSubtitle] = useState("April meetup");

  const [communityValue, setCommunityValue] = useState("general");

  return (
    <>
      <StoryContainer
        title="Create Event Sheet"
        description="Event creation flow — each step and the full drawer"
        variants={[
          {
            id: "full-flow",
            label: "Full Flow",
            children: (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Opens the full multi-step event creation drawer.
                </p>
                <Button onClick={() => setIsOpen(true)}>
                  Open Create Event Drawer
                </Button>
                <CreateEventSheet
                  open={isOpen}
                  userId="story-user-123"
                  defaultSubHeard="general"
                  onOpenChange={setIsOpen}
                />
              </div>
            ),
          },
          {
            id: "event-details",
            label: "Step 1 — Details",
            children: (
              <Card className="p-6 bg-white max-w-md">
                <p className="text-sm text-slate-500 mb-4">
                  The first step where the user enters event name and subtitle.
                </p>
                <EventDetailsStep
                  name={detailsName}
                  subtitle={detailsSubtitle}
                  onNameChange={setDetailsName}
                  onSubtitleChange={setDetailsSubtitle}
                  showError={false}
                />
              </Card>
            ),
          },
          {
            id: "event-details-error",
            label: "Step 1 — Error",
            children: (
              <Card className="p-6 bg-white max-w-md">
                <p className="text-sm text-slate-500 mb-4">
                  Error state when the user tries to continue without a name.
                </p>
                <EventDetailsStep
                  name=""
                  subtitle=""
                  onNameChange={() => {}}
                  onSubtitleChange={() => {}}
                  showError={true}
                />
              </Card>
            ),
          },
          {
            id: "select-community",
            label: "Step 2 — Community",
            children: (
              <Card className="p-6 bg-white max-w-md">
                <p className="text-sm text-slate-500 mb-4">
                  Community picker shared with the conversation creation flow.
                </p>
                <SelectCommunityStep
                  subHeard={communityValue}
                  userId="story-user-123"
                  onSubHeardChange={setCommunityValue}
                />
              </Card>
            ),
          },
          {
            id: "done",
            label: "Step 3 — Done",
            children: (
              <Card className="p-6 bg-white max-w-md">
                <p className="text-sm text-slate-500 mb-4">
                  Final step shown after the event is created.
                </p>
                <EventCreatedStep
                  eventName="Adams Morgan Book Club"
                  onGoToEvent={() => console.log("go to event")}
                />
              </Card>
            ),
          },
        ]}
      />
      <Toaster />
    </>
  );
}
