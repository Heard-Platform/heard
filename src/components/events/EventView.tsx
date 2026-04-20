import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { Event, DebateRoom, NewDebateRoom, Statement, UserSession, VoteType } from "../../types";
import { EventPage } from "./EventPage";
import { EventRoomView } from "./EventRoomView";
import { CreateRoomSheet } from "../CreateRoomSheet";
import { api } from "../../utils/api";
import { formatSubHeardDisplay } from "../../utils/subheard";

export interface EventViewProps {
  event: Event | null;
  eventLoading?: boolean;
  user: UserSession;
  currentSubHeard?: string;
  onExitEvent: () => void;
  onJoinRoom: (roomId: string) => Promise<void>;
  onSubmitStatement: (roomId: string, text: string) => Promise<any>;
  onVoteOnStatement: (statementId: string, voteType: VoteType) => Promise<any>;
  onShowAccountSetupModal: (featureText: string) => void;
  onCreateRoom: (newDebate: NewDebateRoom) => Promise<DebateRoom>;
  onRefreshEvent: () => void;
}

export function EventView({
  event,
  eventLoading,
  user,
  currentSubHeard,
  onExitEvent,
  onJoinRoom,
  onSubmitStatement,
  onVoteOnStatement,
  onShowAccountSetupModal,
  onCreateRoom,
  onRefreshEvent,
}: EventViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<{
    room: DebateRoom;
    statements: Statement[];
  } | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  const handleOpenRoom = async (roomId: string) => {
    setRoomLoading(true);
    setSelectedRoom(null);
    const response = await api.getRoomStatus(roomId);
    if (response.success && response.data) {
      setSelectedRoom({
        room: response.data.room,
        statements: response.data.statements,
      });
    }
    setRoomLoading(false);
  };

  const handleCloseRoom = () => {
    setSelectedRoom(null);
    setRoomLoading(false);
  };

  const handleRefreshStatements = async () => {
    if (!selectedRoom) return;
    const response = await api.getRoomStatus(selectedRoom.room.id);
    if (response.success && response.data) {
      setSelectedRoom({
        room: response.data.room,
        statements: response.data.statements,
      });
    }
  };

  // Use the hook for the full vote flow (error handling, score updates, etc.)
  // then sync the updated statement into local state, since the hook's
  // roomStatements map has no entry for event rooms.
  const handleVoteOnStatement = async (statementId: string, voteType: VoteType) => {
    const result = await onVoteOnStatement(statementId, voteType);
    if (result?.statement) {
      const updated = result.statement;
      setSelectedRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          statements: prev.statements.map((s) =>
            s.id === updated.id ? updated : s,
          ),
        };
      });
    }
    return result;
  };

  const handleCreateRoomSheetChange = (open: boolean) => {
    setCreateRoomOpen(open);
  };

  const handleCreateRoom = async (newDebate: NewDebateRoom): Promise<DebateRoom> => {
    const result = await onCreateRoom(newDebate);
    onRefreshEvent();
    return result;
  };

  const showingRoom = selectedRoom !== null || roomLoading;

  return (
    <div className="flex flex-col h-screen heard-page-bg">
      {/* Header */}
      <div className="controls-layer pt-[6px] px-2 flex justify-center items-center shrink-0">
        <div
          className="flex items-center w-full max-w-2xl"
          style={{ marginTop: 8, marginBottom: 8 }}
        >
          <motion.button
            key={showingRoom ? "room" : "event"}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            onClick={showingRoom ? handleCloseRoom : onExitEvent}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {showingRoom
                ? (event?.name ?? "Back to event")
                : `Back to ${formatSubHeardDisplay(event?.communityName ?? "feed")}`}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Room detail view */}
      {showingRoom && (
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {roomLoading || !selectedRoom ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 heard-spinner"
              />
            </div>
          ) : (
            <EventRoomView
              room={selectedRoom.room}
              statements={selectedRoom.statements}
              user={user}
              currentSubHeard={currentSubHeard}
              onJoin={() => onJoinRoom(selectedRoom.room.id)}
              onSubmitStatement={onSubmitStatement}
              onVoteOnStatement={handleVoteOnStatement}
              onRefreshStatements={handleRefreshStatements}
              onShowAccountSetupModal={onShowAccountSetupModal}
            />
          )}
        </div>
      )}

      {/* Event listing view */}
      {!showingRoom && (
        event ? (
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            <EventPage
              event={event}
              onAddRoom={() => setCreateRoomOpen(true)}
              onOpenRoom={handleOpenRoom}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 heard-spinner"
            />
          </div>
        )
      )}

      {/* Create room sheet — scoped to this event */}
      {event && (
        <CreateRoomSheet
          open={createRoomOpen}
          userId={user.id}
          eventId={event.id}
          defaultSubHeard={event.communityName}
          onOpenChange={handleCreateRoomSheetChange}
          onCreateRoom={handleCreateRoom}
          onExtractTopicAndStatements={async (rant) => {
            const response = await api.extractTopicAndStatements(rant);
            if (!response.success || !response.data) {
              throw new Error(response.error || "Failed to extract topic and statements");
            }
            return response.data;
          }}
        />
      )}
    </div>
  );
}
