import { useState } from "react";
import { CommunityExplorerDialog } from "../components/community/CommunityExplorerDialog";
import { Button } from "../components/ui/button";
import { DebateSessionProvider, OverridableApiMethods } from "../hooks/useDebateSession";
import { mockCommunities } from "./mockData";

const getExplorableSubHeards: OverridableApiMethods["getExplorableSubHeards"] = async (userId: string) => {
  console.log("[Showcase] getExplorableSubHeards called with userId:", userId);
  return {
    success: true,
    data: mockCommunities
  };
};

export function CommunityExplorerDialogStory() {
  const [open, setOpen] = useState(false);

  return (
    <DebateSessionProvider showcaseOverrides={{ getExplorableSubHeards }}>
      <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-700">
        Open Explorer
      </Button>
      <CommunityExplorerDialog
        isOpen={open}
        userId="demo-user-123"
        onClose={() => setOpen(false)}
        onCommunitiesJoined={() => console.log("Communities joined callback triggered")}
      />
    </DebateSessionProvider>
  );
}
