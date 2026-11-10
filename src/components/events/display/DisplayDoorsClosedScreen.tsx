import { DoorClosed } from "lucide-react";
import { DisplayHeadline, DisplayCenteredScreen } from "./DisplayParts";

export function DisplayDoorsClosedScreen() {
  return (
    <DisplayCenteredScreen>
      <DoorClosed className="size-[6cqw] secondary-text" aria-hidden="true" />
      <DisplayHeadline>Doors closed</DisplayHeadline>
      <p className="max-w-[55cqw] leading-snug fullscreen-subheader-text">
        No one can join yet. Move the mouse to show the controls, then press Open doors. The join code will appear here.
      </p>
      <p className="max-w-[55cqw] text-[1.4cqw] leading-snug secondary-text">
        Once the doors open, the onboarding questions are locked, and the doors can't be closed again. You can still
        reorder posts until you start.
      </p>
    </DisplayCenteredScreen>
  );
}
