import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import type {
  DebateRoom,
  Statement,
  UserPresence,
  VoteType,
  UserSession,
} from "../types";
import { RoomCard } from "./RoomCard";
import { VineNavigator } from "./monkey/VineNavigator";
import { useDebateSession } from "../hooks/useDebateSession";

interface RoomScrollerProps {
  rooms: DebateRoom[];
  isDeveloper: boolean;
  loading: boolean;
  user: UserSession;
  currentSubHeard?: string;
  roomStatements: Record<string, Statement[]>;
  analysisRoomId?: string;
  presences: UserPresence[];
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onSubmitStatement: (
    roomId: string,
    text: string,
  ) => Promise<any>;
  onVoteOnStatement: (
    statementId: string,
    voteType: VoteType,
  ) => Promise<any>;
  onDiscussStatement: (
    statementText: string,
    subHeard?: string,
  ) => void;
  onUpdatePresence: (
    userId: string,
    currentRoomIndex: number,
  ) => void;
  onShowAccountSetupModal: (featureText: string) => void;
}

export interface RoomScrollerRef {
  scrollToTop: () => void;
}

export const RoomScroller = forwardRef<
  RoomScrollerRef,
  RoomScrollerProps
>(
  (
    {
      rooms,
      onJoinRoom,
      onCreateRoom,
      onSubmitStatement,
      onVoteOnStatement,
      isDeveloper,
      loading,
      user,
      currentSubHeard,
      onDiscussStatement,
      roomStatements,
      analysisRoomId,
      presences,
      onUpdatePresence,
      onShowAccountSetupModal,
    },
    ref,
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef(false);
    const isPolling = useRef(false);
    const [loadingRooms, setLoadingRooms] = useState<
      Record<string, boolean>
    >({});
    const { getRoomStatements } = useDebateSession();

    // Function to refresh statements for a specific room
    const refreshRoomStatements = async (roomId: string) => {
      try {
        setLoadingRooms((prev) => ({
          ...prev,
          [roomId]: true,
        }));
        await getRoomStatements(roomId);
      } catch (error) {
        console.error(
          `Error refreshing statements for room ${roomId}:`,
          error,
        );
      } finally {
        setLoadingRooms((prev) => ({
          ...prev,
          [roomId]: false,
        }));
      }
    };

    // Fetch statements for all rooms
    useEffect(() => {
      if (rooms.length > 0) {
        rooms.forEach(room => {
          refreshRoomStatements(room.id);
        });
      }
    }, [rooms, currentSubHeard]);

    // Combine rooms with a "create new" card at the end
    const allCards = [
      ...rooms,
      { id: "create-new", isCreateCard: true },
    ] as Array<DebateRoom | { id: string; isCreateCard: true }>;

    // Poll for updates on the currently visible room
    useEffect(() => {
      if (currentIndex >= rooms.length) return;

      const currentRoom = rooms[currentIndex];
      if (!currentRoom) return;

      refreshRoomStatements(currentRoom.id);

      const pollInterval = setInterval(async () => {
        if (isPolling.current) return;
        
        isPolling.current = true;
        try {
          await getRoomStatements(currentRoom.id);
        } catch (error) {
          console.error(`Error polling room ${currentRoom.id}:`, error);
        } finally {
          isPolling.current = false;
        }
      }, 3000);

      return () => {
        clearInterval(pollInterval);
        isPolling.current = false;
      };
    }, [currentIndex, rooms]);

    // Handle scroll events with debouncing
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      let scrollTimeout: NodeJS.Timeout;

      const handleScroll = () => {
        if (isScrolling.current) return;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const scrollPosition = container.scrollTop;
          const cardHeight = container.clientHeight;
          const newIndex = Math.round(
            scrollPosition / cardHeight,
          );

          if (
            newIndex !== currentIndex &&
            newIndex >= 0 &&
            newIndex < allCards.length
          ) {
            setCurrentIndex(newIndex);
          }
        }, 150);
      };

      container.addEventListener("scroll", handleScroll, {
        passive: true,
      });
      return () => {
        container.removeEventListener("scroll", handleScroll);
        clearTimeout(scrollTimeout);
      };
    }, [currentIndex, allCards.length]);

    const scrollToIndex = (index: number) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      isScrolling.current = true;
      const cardHeight = container.clientHeight;

      container.scrollTo({
        top: index * cardHeight,
        behavior: "smooth",
      });

      setTimeout(() => {
        isScrolling.current = false;
        setCurrentIndex(index);
      }, 500);
    };

    // Expose scrollToTop method via ref
    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        scrollToIndex(0);
      },
    }));

    // Reset scroll to top when rooms change (e.g., when sub-heard changes)
    useEffect(() => {
      scrollToIndex(0);
    }, [rooms.length]);

    if (loading) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-8 h-8 heard-spinner"
          />
        </div>
      );
    }

    return (
      <div className="relative h-screen w-full overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory scroll-smooth relative"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            overscrollBehaviorY: "contain",
          }}
        >
          <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

          <VineNavigator
            totalCards={allCards.length}
            currentIndex={currentIndex}
            currentUserId={user.id}
            presences={
              presences?.filter(
                (p) => p.userId !== user.id,
              ) || []
            }
            onUpdatePresence={onUpdatePresence}
          />

          {allCards.map((card, index) => {
            const isCreateCard =
              "isCreateCard" in card && card.isCreateCard;
            const room = isCreateCard
              ? null
              : (card as DebateRoom);

            return (
              <div
                key={card.id}
                className="h-screen w-full snap-start snap-always flex items-start justify-center pt-15 pb-20 px-4"
              >
                {isCreateCard ? (
                  <CreateRoomCard onCreateRoom={onCreateRoom} />
                ) : room ? (
                  <RoomCard
                    room={room}
                    statements={roomStatements[room.id] || []}
                    isDeveloper={isDeveloper}
                    isActive={index === currentIndex}
                    user={user}
                    currentSubHeard={currentSubHeard}
                    loadingStatements={
                      loadingRooms[room.id] || false
                    }
                    analysisRoomId={analysisRoomId}
                    onJoin={() => onJoinRoom(room.id)}
                    onSubmitStatement={onSubmitStatement}
                    onVoteOnStatement={onVoteOnStatement}
                    onRefreshStatements={() =>
                      refreshRoomStatements(room.id)
                    }
                    onDiscussStatement={onDiscussStatement}
                    onShowAccountSetupModal={onShowAccountSetupModal}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

// Create new room card
function CreateRoomCard({
  onCreateRoom,
}: {
  onCreateRoom: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 border-2 border-green-200 shadow-2xl">
        <div className="p-8 space-y-6 text-center flex flex-col items-center justify-center min-h-[500px]">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
          >
            <Plus className="w-12 h-12 text-white" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Start a New Conversation
            </h2>
            <p className="text-muted-foreground">
              Create your own room and invite others to join the
              discussion
            </p>
          </div>

          <Button
            onClick={onCreateRoom}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg py-6 px-8"
          >
            Create New Room
            <Plus className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}