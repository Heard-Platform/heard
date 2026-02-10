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
  const [joinedCount, setJoinedCount] = useState(0);

  const handleCommunitiesJoined = () => {
    setJoinedCount((prev) => prev + 1);
    console.log("Communities joined!");
  };

  return (
    <DebateSessionProvider showcaseOverrides={{ getExplorableSubHeards }}>
      <div className="p-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Community Explorer Dialog
          </h2>
          <p className="text-slate-600 mb-4">
            A dialog for discovering and joining new public communities that the user hasn't joined yet
          </p>

          <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-700">
            Open Explorer
          </Button>

          {joinedCount > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-slate-900">
                Join actions triggered: {joinedCount}
              </p>
            </div>
          )}
        </div>

        <CommunityExplorerDialog
          isOpen={open}
          userId="demo-user-123"
          onClose={() => setOpen(false)}
          onCommunitiesJoined={handleCommunitiesJoined}
        />
      </div>
    </DebateSessionProvider>
  );
}
