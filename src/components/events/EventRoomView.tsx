import { motion } from "motion/react";
import { RoomCard } from "../RoomCard";
import { SwipeTutorialProvider } from "../../contexts/SwipeTutorialContext";
import { DebateRoom, Statement, UserSession, VoteType } from "../../types";

export interface EventRoomViewProps {
  room: DebateRoom;
  statements: Statement[];
  user: UserSession;
  currentSubHeard?: string;
  onJoin: () => void;
  onSubmitStatement: (roomId: string, text: string) => Promise<any>;
  onVoteOnStatement: (statementId: string, voteType: VoteType) => Promise<any>;
  onRefreshStatements: () => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
}

export function EventRoomView({
  room,
  statements,
  user,
  currentSubHeard,
  onJoin,
  onSubmitStatement,
  onVoteOnStatement,
  onRefreshStatements,
  onShowAccountSetupModal,
}: EventRoomViewProps) {
  return (
    <motion.div
      key={room.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto pt-2"
    >
      <SwipeTutorialProvider>
        <RoomCard
          room={room}
          statements={statements}
          loadingStatements={false}
          isDeveloper={user.isDeveloper || false}
          isActive={true}
          user={user}
          currentSubHeard={currentSubHeard}
          onJoin={onJoin}
          onSubmitStatement={onSubmitStatement}
          onVoteOnStatement={onVoteOnStatement}
          onSwipedAllChange={() => {}}
          onRefreshStatements={onRefreshStatements}
          onDiscussStatement={() => {}}
          onShowAccountSetupModal={onShowAccountSetupModal}
        />
      </SwipeTutorialProvider>
    </motion.div>
  );
}
