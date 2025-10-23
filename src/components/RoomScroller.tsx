import { useState, useRef, useEffect } from "react";
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
  XCircle,
} from "lucide-react";
import type { DebateRoom } from "../types";

interface RoomScrollerProps {
  rooms: DebateRoom[];
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onSetRoomInactive?: (roomId: string) => Promise<boolean>;
  isDeveloper: boolean;
  loading: boolean;
}

export function RoomScroller({
  rooms,
  onJoinRoom,
  onCreateRoom,
  onSetRoomInactive,
  isDeveloper,
  loading,
}: RoomScrollerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // Combine rooms with a "create new" card at the end
  const allCards = [
    ...rooms,
    { id: "create-new", isCreateCard: true },
  ] as Array<DebateRoom | { id: string; isCreateCard: true }>;

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
              className="h-screen w-full snap-start snap-always flex items-center justify-center p-4"
            >
              {isCreateCard ? (
                <CreateRoomCard onCreateRoom={onCreateRoom} />
              ) : room ? (
                <RoomCard
                  room={room}
                  onJoin={() => onJoinRoom(room.id)}
                  onSetInactive={onSetRoomInactive ? () => onSetRoomInactive(room.id) : undefined}
                  isDeveloper={isDeveloper}
                  isActive={index === currentIndex}
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
}

// Individual room card component
function RoomCard({
  room,
  onJoin,
  onSetInactive,
  isDeveloper,
  isActive,
}: {
  room: DebateRoom;
  onJoin: () => void;
  onSetInactive?: () => Promise<boolean>;
  isDeveloper: boolean;
  isActive: boolean;
}) {
  const participantCount = room.participants?.length || 0;
  const isRantFirst = room.rantFirst;
  const isRealtime = room.mode === "realtime";

  // Determine room status
  const isActive_status = room.phase !== "lobby" && room.phase !== "results";
  const isWaiting = room.phase === "lobby";
  const isCompleted = room.phase === "results";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isActive ? 1 : 0.95, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 border-2 border-purple-200 shadow-2xl">
        {/* Status badge */}
        <div className="absolute top-4 right-4 z-10">
          {isCompleted ? (
            <Badge className="bg-gray-600 text-white">Completed</Badge>
          ) : isActive_status ? (
            <Badge className="bg-green-600 text-white animate-pulse">
              🔴 Live
            </Badge>
          ) : (
            <Badge className="bg-blue-600 text-white">Waiting</Badge>
          )}
        </div>

        {/* Dev button to mark inactive */}
        {isDeveloper && onSetInactive && (
          <div className="absolute top-4 left-4 z-10">
            <Button
              onClick={async (e) => {
                e.stopPropagation();
                await onSetInactive();
              }}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Hide
            </Button>
          </div>
        )}

        <div className="p-8 space-y-6">
          {/* Topic */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">
                Debate Topic
              </span>
            </div>
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              {room.topic}
            </h2>
          </motion.div>

          {/* Description */}
          {room.description && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 backdrop-blur-sm rounded-lg p-4 max-h-32 overflow-y-auto"
            >
              <p className="text-sm text-muted-foreground line-clamp-4">
                {room.description}
              </p>
            </motion.div>
          )}

          {/* Room info grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            {/* Participants */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {participantCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {participantCount === 1 ? "Player" : "Players"}
                </p>
              </div>
            </div>

            {/* Game number */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  #{room.gameNumber}
                </p>
                <p className="text-xs text-muted-foreground">Game</p>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2"
          >
            {isRantFirst && (
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-700 border-purple-300"
              >
                <Brain className="w-3 h-3 mr-1" />
                Rant First
              </Badge>
            )}
            {isRealtime && (
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-700 border-blue-300"
              >
                <Clock className="w-3 h-3 mr-1" />
                Real-time
              </Badge>
            )}
            {!isRealtime && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-700 border-green-300"
              >
                Host-controlled
              </Badge>
            )}
          </motion.div>

          {/* Join button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={onJoin}
              disabled={isCompleted}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6"
            >
              {isCompleted
                ? "Debate Ended"
                : isActive_status
                  ? "Join Live Debate"
                  : "Join Room"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
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
