import { useState } from "react";
import { SubHeardBrowser } from "./community/SubHeardBrowser";
import { SidePanelMenu } from "./SidePanelMenu";
import { RoomCard } from "./RoomCard";
import { RoomAlertsProvider } from "../contexts/RoomAlertsContext";
import type { DebateRoom, Statement, VoteType, UserSession, SubHeard } from "../types";

interface SinglePostViewProps {
  room: DebateRoom;
  statements: Statement[];
  loadingStatements: boolean;
  user: UserSession;
  currentSubHeard?: string;
  isDeveloper?: boolean;
  onSubmitStatement: (roomId: string, text: string) => Promise<any>;
  onVoteOnStatement: (statementId: string, voteType: VoteType) => Promise<any>;
  onRefreshStatements: () => Promise<void>;
  onSubHeardChange: (subHeard: string | null) => void;
  onUpdateSubHeard: (update: SubHeard, userId: string) => Promise<boolean>;
  onShowAccountSetupModal: (featureText: string) => void;
  onOpenExplorer: () => void;
  onDiscussStatement: (statementText: string, subHeard?: string) => void;
  onLogout: () => void;
  onOpenHelp: () => void;
  onOpenFeatureTracker: () => void;
  onJumpToRoom: (roomId: string, subHeard?: string) => void;
}

export function SinglePostView({
  room,
  statements,
  loadingStatements,
  user,
  currentSubHeard,
  isDeveloper = false,
  onSubmitStatement,
  onVoteOnStatement,
  onRefreshStatements,
  onSubHeardChange,
  onUpdateSubHeard,
  onShowAccountSetupModal,
  onOpenExplorer,
  onDiscussStatement,
  onLogout,
  onOpenHelp,
  onOpenFeatureTracker,
  onJumpToRoom,
}: SinglePostViewProps) {
  const [swipedAll, setSwipedAll] = useState(false);

  return (
    <RoomAlertsProvider>
      <div
        className="dark min-h-screen flex flex-col"
        style={{ background: "linear-gradient(to bottom right, #3b0764, #1e0a4b)" }}
      >
        {/* Header */}
        <div className="controls-layer pt-[6px] px-2 flex justify-center items-center shrink-0">
          <div
            className="flex items-center justify-between gap-2 w-full max-w-2xl"
            style={{ marginTop: 8 }}
          >
            <div className="flex-1 min-w-0 mr-3">
              <SubHeardBrowser
                currentSubHeard={currentSubHeard}
                user={user}
                onSubHeardChange={onSubHeardChange}
                onUpdateSubHeard={onUpdateSubHeard}
                onShowAccountSetupModal={onShowAccountSetupModal}
                onOpenExplorer={onOpenExplorer}
                onLogoClick={() => {}}
              />
            </div>
            <SidePanelMenu
              user={user}
              onLogout={onLogout}
              onOpenHelp={onOpenHelp}
              onOpenFeatureTracker={onOpenFeatureTracker}
              onShowAccountSetupModal={onShowAccountSetupModal}
              onJumpToRoom={onJumpToRoom}
            />
          </div>
        </div>

        {/* Post */}
        <div className="flex-1 flex justify-center px-4 py-4">
          <div className="w-full max-w-2xl">
            <RoomCard
              room={room}
              statements={statements}
              loadingStatements={loadingStatements}
              isDeveloper={isDeveloper}
              isActive={true}
              user={user}
              currentSubHeard={currentSubHeard}
              onJoin={() => {}}
              onSubmitStatement={onSubmitStatement}
              onVoteOnStatement={onVoteOnStatement}
              onSwipedAllChange={setSwipedAll}
              onRefreshStatements={onRefreshStatements}
              onDiscussStatement={onDiscussStatement}
              onShowAccountSetupModal={onShowAccountSetupModal}
            />
          </div>
        </div>
      </div>
    </RoomAlertsProvider>
  );
}
