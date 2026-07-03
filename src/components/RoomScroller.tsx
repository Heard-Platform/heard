import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion } from "motion/react";
import type {
  DebateRoom,
  Statement,
  UserPresence,
  VoteType,
  UserSession,
  EventSummary,
} from "../types";
import { RoomCard } from "./RoomCard";
import { useDebateSession } from "../hooks/useDebateSession";
import { SwipeTutorialProvider, useSwipeTutorialContext } from "../contexts/SwipeTutorialContext";
import { CreateRoomCard } from "./CreateRoomCard";
import { EventCard } from "./events/EventCard";
import { safelySetStorageItem } from "../utils/localStorage";
import { api, safelyMakeApiCall } from "../utils/api";
import { useRoomAlertsContext } from "../contexts/RoomAlertsContext";

const LAST_VIEWED_ROOM_KEY = "lastViewedRoom";

type EventCard = EventSummary & { cardType: "event" };
type CreateCard = { id: string; cardType: "create" };
type RoomCard = DebateRoom & { cardType: "room" };
type Card = EventCard | RoomCard | CreateCard;

const isEventCard = (card: Card): card is EventCard => card.cardType === "event";
const isCreateCard = (card: Card): card is CreateCard => card.cardType === "create";
const isRoomCard = (card: Card): card is RoomCard => card.cardType === "room";

interface RoomScrollerProps {
  rooms: DebateRoom[];
  events: EventSummary[];
  isDeveloper: boolean;
  loading: boolean;
  user: UserSession;
  currentSubHeard?: string;
  roomStatements: Record<string, Statement[]>;
  analysisRoomId?: string;
  targetStatementId?: string;
  presences: UserPresence[];
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onOpenExplorer: () => void;
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
    currentRoomIndex: number,
  ) => void;
  onShowAccountSetupModal: (featureText: string) => void;
  onOpenEvent: (eventId: string) => void;
  onSubHeardChange: (subHeard: string | null) => void;
}

export interface RoomScrollerRef {
  scrollToTop: () => void;
}

const RoomScrollerInner = forwardRef<
  RoomScrollerRef,
  RoomScrollerProps
>(
  (
    {
      rooms,
      events,
      onJoinRoom,
      onCreateRoom,
      onOpenExplorer,
      onSubmitStatement,
      onVoteOnStatement,
      isDeveloper,
      loading,
      user,
      currentSubHeard,
      onDiscussStatement,
      roomStatements,
      analysisRoomId,
      targetStatementId,
      presences,
      onUpdatePresence,
      onShowAccountSetupModal,
      onOpenEvent,
      onSubHeardChange,
    },
    ref,
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrolling = useRef(false);
    const isPolling = useRef(false);
    const { clearAlert } = useRoomAlertsContext();
    const currentIndexRef = useRef(0);
    const allCardsLengthRef = useRef(0);
    const scrollRafRef = useRef<number | undefined>(undefined);
    const [loadingRooms, setLoadingRooms] = useState<
      Record<string, boolean>
    >({});
    const { getRoomStatements } = useDebateSession();
    const { resetTutorialTimer } = useSwipeTutorialContext();

    // Combine events (at top), rooms, and a "create new" card at the end
    const allCards: Card[] = [
      ...events.map((e) => ({ ...e, cardType: "event" as const })),
      ...rooms.map((r) => ({ ...r, cardType: "room" as const })),
      { id: "create-new", cardType: "create" as const },
    ];

    currentIndexRef.current = currentIndex;
    allCardsLengthRef.current = allCards.length;

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

    useEffect(() => {
      const card = allCards[currentIndex];
      if (card && isRoomCard(card)) {
        safelySetStorageItem(LAST_VIEWED_ROOM_KEY, card.id);
        clearAlert(card.id);
        safelyMakeApiCall(() => api.markRoomSeen(card.id));
      }
    }, [currentIndex, rooms, events]);

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

    const handleScroll = useCallback(() => {
      if (isScrolling.current) return;
      resetTutorialTimer();

      if (scrollRafRef.current !== undefined) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = undefined;

        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollMid = container.scrollTop + container.clientHeight / 2;
        let bestIndex = 0;
        let bestDist = Infinity;
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          const dist = Math.abs(el.offsetTop + el.offsetHeight / 2 - scrollMid);
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
          }
        });

        if (bestIndex !== currentIndexRef.current) {
          setCurrentIndex(bestIndex);
        }
      });
    }, []);

    useEffect(() => {
      if (loading) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        container.removeEventListener("scroll", handleScroll);
        if (scrollRafRef.current !== undefined) {
          cancelAnimationFrame(scrollRafRef.current);
        }
      };
    }, [handleScroll, loading]);

    const scrollToIndex = (index: number) => {
      const container = scrollContainerRef.current;
      const card = cardRefs.current[index];
      if (!container || !card) return;

      isScrolling.current = true;
      container.scrollTo({ top: card.offsetTop, behavior: "smooth" });

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

    // Reset scroll to top when sub-heard changes
    useEffect(() => {
      scrollToIndex(0);
    }, [currentSubHeard, rooms.length]);

    if (loading) {
      return (
        <div className="h-dvh w-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
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
      <div className="relative h-dvh w-full overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full w-full overflow-y-scroll overflow-x-hidden relative"
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

          {allCards.map((card, index) => {
            const room = isRoomCard(card) ? card : null;
            const event = isEventCard(card) ? card : null;

            return (
              <div
                key={card.id}
                ref={(el) => { cardRefs.current[index] = el; }}
                className={`w-full flex justify-center items-center px-2 py-3 ${index === 0 ? "pt-14" : ""} ${index === allCards.length - 1 ? "min-h-[70dvh]" : ""}`}
              >
                {isCreateCard(card) ? (
                  <CreateRoomCard
                    isActive={index === currentIndex}
                    onCreateRoom={onCreateRoom}
                    onOpenExplorer={onOpenExplorer}
                  />
                ) : event ? (
                  <EventCard event={event} onOpen={onOpenEvent} />
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
                    targetStatementId={targetStatementId}
                    onJoin={() => onJoinRoom(room.id)}
                    onSubmitStatement={onSubmitStatement}
                    onVoteOnStatement={onVoteOnStatement}
                    onRefreshStatements={() =>
                      refreshRoomStatements(room.id)
                    }
                    onDiscussStatement={onDiscussStatement}
                    onShowAccountSetupModal={onShowAccountSetupModal}
                    onSubHeardChange={onSubHeardChange}
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

export const RoomScroller = forwardRef<RoomScrollerRef, RoomScrollerProps>(
  (props, ref) => (
    <SwipeTutorialProvider>
      <RoomScrollerInner {...props} ref={ref} />
    </SwipeTutorialProvider>
  ),
);