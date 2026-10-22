import { ShieldAlert } from "lucide-react";
import { formatSubHeardDisplay } from "../../../utils/subheard";

export function ModeratorControlsRefusal({ communityName }: { communityName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto px-6 gap-3 text-center">
      <ShieldAlert className="w-10 h-10 text-muted-foreground" />
      <p className="text-lg font-bold text-foreground">
        Only moderators of {formatSubHeardDisplay(communityName)} can run this event.
      </p>
    </div>
  );
}
