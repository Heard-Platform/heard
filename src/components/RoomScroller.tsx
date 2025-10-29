import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
  Users,
  Clock,
  ChevronDown,
  Plus,
  Brain,
  Zap,
  MessageCircle,
  ArrowRight,
  Hash,
  Settings,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import type { DebateRoom, Statement } from "../types";
import { SwipeableStatementStack } from "./SwipeableStatementStack";
import { InProgressResults } from "./results/InProgressResults";
import { ConcludedResults } from "./results/ConcludedResults";
import { NewStatementInput } from "./NewStatementInput";
import { RantSubmission } from "./RantSubmission";
import { RealtimeCountdown } from "./RealtimeCountdown";
import { api } from "../utils/api";

interface RoomScrollerProps {
  rooms: DebateRoom[];
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onSetRoomInactive?: (roomId: string) => Promise<boolean>;
  isDeveloper: boolean;
  loading: boolean;
  currentUserId?: string;
  currentSubHeard?: string;
  onDiscussStatement?: (statementText: string, subHeard?: string) => void;
}

export interface RoomScrollerRef {
  scrollToTop: () => void;
}

export const RoomScroller = forwardRef<RoomScrollerRef, RoomScrollerProps>(({
  rooms,
  onJoinRoom,
  onCreateRoom,
  onSetRoomInactive,
  isDeveloper,
  loading,
  currentUserId,
  currentSubHeard,
  onDiscussStatement,
}, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const [roomStatements, setRoomStatements] = useState<Record<string, Statement[]>>({});

  // Function to refresh statements for a specific room
  const refreshRoomStatements = async (roomId: string) => {
    try {
      const response = await api.getRoomStatus(roomId);
      if (response.success && response.data) {
        setRoomStatements(prev => ({
          ...prev,
          [roomId]: response.data.statements || []
        }));
      }
    } catch (error) {
      console.error(`Error refreshing statements for room ${roomId}:`, error);
    }
  };

  // Fetch statements for all rooms
  useEffect(() => {
    const fetchStatements = async () => {
      const statementsMap: Record<string, Statement[]> = {};
      
      for (const room of rooms) {
        try {
          const response = await api.getRoomStatus(room.id);
          if (response.success && response.data) {
            statementsMap[room.id] = response.data.statements || [];
          }
        } catch (error) {
          console.error(`Error fetching statements for room ${room.id}:`, error);
          statementsMap[room.id] = [];
        }
      }
      
      setRoomStatements(statementsMap);
    };
    
    if (rooms.length > 0) {
      fetchStatements();
    }
  }, [rooms]);

  // Combine rooms with a "create new" card at the end
  const allCards = [
    ...rooms,
    { id: "create-new", isCreateCard: true },
  ] as Array<DebateRoom | { id: string; isCreateCard: true }>;

  // Poll for updates on the currently visible room
  useEffect(() => {
    if (currentIndex >= rooms.length) return; // Don't poll for "create new" card
    
    const currentRoom = rooms[currentIndex];
    if (!currentRoom) return;

    // Immediately fetch on index change
    refreshRoomStatements(currentRoom.id);

    // Then set up polling interval
    const pollInterval = setInterval(() => {
      refreshRoomStatements(currentRoom.id);
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
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
        const newIndex = Math.round(scrollPosition / cardHeight);
        
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < allCards.length) {
          setCurrentIndex(newIndex);
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
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
    }
  }));

  // Reset scroll to top when rooms change (e.g., when sub-heard changes)
  useEffect(() => {
    scrollToIndex(0);
  }, [rooms.length]);

  const handleNext = () => {
    if (currentIndex < allCards.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

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
          className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Scroll container with snap points */}
      <div
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {allCards.map((card, index) => {
          const isCreateCard = "isCreateCard" in card && card.isCreateCard;
          const room = isCreateCard ? null : (card as DebateRoom);

          return (
            <div
              key={card.id}
              className="h-screen w-full snap-start snap-always flex items-start justify-center pt-20 pb-20 px-4 overflow-y-auto"
            >
              {isCreateCard ? (
                <CreateRoomCard onCreateRoom={onCreateRoom} />
              ) : room ? (
                <RoomCard
                  room={room}
                  statements={roomStatements[room.id] || []}
                  onJoin={() => onJoinRoom(room.id)}
                  onSetInactive={onSetRoomInactive ? () => onSetRoomInactive(room.id) : undefined}
                  isDeveloper={isDeveloper}
                  isActive={index === currentIndex}
                  currentUserId={currentUserId}
                  onRefreshStatements={() => refreshRoomStatements(room.id)}
                  currentSubHeard={currentSubHeard}
                  onDiscussStatement={onDiscussStatement}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Scroll indicator */}
      {currentIndex < allCards.length - 1 && (
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          onClick={handleNext}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg cursor-pointer">
            <ChevronDown className="w-6 h-6 text-purple-600" />
          </div>
        </motion.div>
      )}

      {/* Page indicator dots */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-10">
        {allCards.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-purple-600 h-8"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

// Individual room card component
function RoomCard({
  room,
  statements,
  onJoin,
  onSetInactive,
  isDeveloper,
  isActive,
  currentUserId,
  onRefreshStatements,
  currentSubHeard,
  onDiscussStatement,
}: {
  room: DebateRoom;
  statements: Statement[];
  onJoin: () => void;
  onSetInactive?: () => Promise<boolean>;
  isDeveloper: boolean;
  isActive: boolean;
  currentUserId?: string;
  onRefreshStatements?: () => Promise<void>;
  currentSubHeard?: string;
  onDiscussStatement?: (statementText: string, subHeard?: string) => void;
}) {
  const participantCount = room.participants?.length || 0;
  const isRantFirst = room.rantFirst;
  const isRealtime = room.mode === "realtime";
  
  // Check if realtime room has ended
  const hasRealtimeEnded = isRealtime && room.endTime && Date.now() >= room.endTime;

  // Determine room status
  const isActive_status = room.phase !== "lobby" && room.phase !== "results";
  const isWaiting = room.phase === "lobby";
  const isCompleted = room.phase === "results" || hasRealtimeEnded;

  // Handle voting
  const handleVote = async (statementId: string, voteType: "agree" | "disagree" | "pass" | "super_agree") => {
    if (!currentUserId) {
      console.error("No user ID available for voting");
      return null;
    }
    
    try {
      const response = await api.voteOnStatement(statementId, voteType, currentUserId);
      if (response.success && response.data) {
        return response.data as Statement;
      }
      return null;
    } catch (error) {
      console.error("Error voting on statement:", error);
      return null;
    }
  };

  // Handle statement submission
  const handleSubmitStatement = async (text: string) => {
    if (!currentUserId) {
      console.error("No user ID available for submitting statement");
      throw new Error("User not logged in");
    }
    
    try {
      const response = await api.submitStatement(room.id, text, currentUserId);
      if (!response.success) {
        throw new Error(response.error || "Failed to submit statement");
      }
      // Refresh statements to show the new one
      if (onRefreshStatements) {
        await onRefreshStatements();
      }
    } catch (error) {
      console.error("Error submitting statement:", error);
      throw error;
    }
  };

  // Handle rant submission
  const [isSubmittingRant, setIsSubmittingRant] = useState(false);
  const handleSubmitRant = async (text: string) => {
    if (!currentUserId) {
      console.error("No user ID available for submitting rant");
      throw new Error("User not logged in");
    }
    
    setIsSubmittingRant(true);
    try {
      const response = await api.submitRant(room.id, text, currentUserId);
      if (!response.success) {
        throw new Error(response.error || "Failed to submit rant");
      }
      // Refresh statements to show the AI-extracted statements
      if (onRefreshStatements) {
        await onRefreshStatements();
      }
    } catch (error) {
      console.error("Error submitting rant:", error);
      throw error;
    } finally {
      setIsSubmittingRant(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isActive ? 1 : 0.95, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl"
    >
      <Card className="relative bg-gradient-to-br from-purple-50 via-white to-blue-50 border-2 border-purple-200 shadow-2xl">
        <div className="p-6 space-y-4">
          {/* Compact header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative space-y-2"
          >
            {/* Status badges in top right */}
            <div className="absolute top-0 right-0 flex flex-col items-end gap-1.5">
              {isCompleted ? (
                <Badge className="bg-gray-600 text-white">Completed</Badge>
              ) : isActive_status ? (
                <Badge className="bg-green-600 text-white animate-pulse">
                  🔴 Live
                </Badge>
              ) : (
                <Badge className="bg-blue-600 text-white">Waiting</Badge>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {/* Settings menu for developers */}
                {isDeveloper && onSetInactive && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onSetInactive();
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Mark as Inactive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Users className="w-4 h-4" />
                <span>{participantCount}</span>
              </div>
            </div>
            
            {/* Title with space for badges */}
            <div className="flex items-start gap-2 pr-24">
              <MessageCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-1" />
              <h2 className="font-bold text-foreground">
                {room.topic}
              </h2>
            </div>
            
            {/* Features badges */}
            <div className="flex flex-wrap gap-2">
              {room.subHeard && !currentSubHeard && (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  {room.subHeard.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Badge>
              )}
              {isRantFirst && (
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  Rant First
                </Badge>
              )}
              {isRealtime && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Real-time
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Realtime Countdown */}
          {isRealtime && room.endTime && !hasRealtimeEnded && (
            <RealtimeCountdown
              endTime={room.endTime}
              onTimeUp={() => {
                // Refresh room data when time is up
                if (onRefreshStatements) {
                  onRefreshStatements();
                }
              }}
            />
          )}

          {/* Statement Stack or Results */}
          {hasRealtimeEnded && statements.length > 0 ? (
            <ConcludedResults 
              statements={statements} 
              onDiscuss={onDiscussStatement ? (text) => onDiscussStatement(text, room.subHeard) : undefined} 
            />
          ) : statements.length > 0 ? (() => {
            // Check if user has voted on all statements
            const hasVotedOnAll = currentUserId && statements.every(
              statement => statement.voters && statement.voters[currentUserId]
            );

            // If user has voted on all statements, show InProgressResults + input
            if (hasVotedOnAll) {
              return (
                <div className="space-y-4">
                  <InProgressResults statements={statements} />
                  {/* New Statement Input */}
                  {currentUserId && (
                    <NewStatementInput onSubmitStatement={handleSubmitStatement} />
                  )}
                </div>
              );
            }

            // Otherwise show the swipeable stack
            return (
              <SwipeableStatementStack
                statements={statements}
                onVote={handleVote}
                currentUserId={currentUserId}
                onSubmitStatement={handleSubmitStatement}
              />
            );
          })() : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  No statements yet in this debate
                </p>
              </div>
              {/* Show rant input to add initial statements */}
              {currentUserId && !isCompleted && (
                <RantSubmission
                  onSubmit={handleSubmitRant}
                  isSubmitting={isSubmittingRant}
                  placeholder="Share your thoughts on this topic and we'll create debate points from your rant!"
                />
              )}
              {!currentUserId && (
                <Button
                  onClick={onJoin}
                  disabled={isCompleted}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {isCompleted ? "Debate Ended" : "Join to Add Statements"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Create new room card
function CreateRoomCard({ onCreateRoom }: { onCreateRoom: () => void }) {
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
              Start a New Debate
            </h2>
            <p className="text-muted-foreground">
              Create your own room and invite others to join the discussion
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
