import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { NicknameSetup } from "./components/NicknameSetup";
import { LobbyScreen } from "./screens/LobbyScreen";
import { GameScreen } from "./screens/GameScreen";
import { ComponentShowcase } from "./screens/ComponentShowcase";
import { useDebateSession } from "./hooks/useDebateSession";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import {
  parseRoomIdFromUrl,
  updateUrlForRoom,
  clearRoomFromUrl,
} from "./utils/url";
import type {
  Phase,
  SubPhase,
  Statement,
  Achievement,
  VoteType,
} from "./types";

export default function App() {
  const [timerActive, setTimerActive] = useState(false);
  const [startingDebate, setStartingDebate] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState<
    string | null
  >(null);
  const [hasCheckedUrl, setHasCheckedUrl] = useState(false);
  const [showComponentShowcase, setShowComponentShowcase] = useState(false);

  const {
    user,
    room,
    statements,
    rants,
    activeRooms,
    loading,
    error,
    lastAchievement,
    autoPlayActive,
    initializeUser,
    createRoom,
    joinRoom,
    getActiveRooms,
    submitStatement,
    submitRant,
    voteOnStatement,
    updateRoomPhase,
    updateRoomDescription,
    leaveRoom,
    resetSession,
    createSeedData,
    createTestRoom,
    createRantTestRoom,
    setRoomInactive,
    startAutoPlay,
    stopAutoPlay,
  } = useDebateSession();

  // Helper function to join room and set timer state consistently
  const handleJoinRoomWithTimer = useCallback(
    async (roomId: string) => {
      const roomData = await joinRoom(roomId);
      if (roomData) {
        setTimerActive(
          roomData.mode === "realtime" &&
            roomData.phase !== "lobby" &&
            roomData.phase !== "results",
        );
        return roomData;
      }
      return null;
    },
    [joinRoom],
  );

  // Handle nickname setup completion
  const handleNicknameComplete = async (
    nickname: string,
    email: string,
  ) => {
    await initializeUser(nickname, email);

    // If there's a target room ID, try to join it after user creation
    if (targetRoomId) {
      const roomData =
        await handleJoinRoomWithTimer(targetRoomId);
      if (roomData) {
        setTargetRoomId(null); // Clear target after successful join
      }
    }
  };

  // Handle room creation
  const handleCreateRoom = async (
    topic: string,
    mode: "realtime" | "host-controlled",
    rantFirst?: boolean,
    description?: string,
  ) => {
    const roomData = await createRoom(
      topic,
      mode,
      rantFirst,
      description,
    );
    if (roomData) {
      // Rant-first rooms start in round1/posting, regular rooms start in lobby
      setTimerActive(
        mode === "realtime" &&
          rantFirst === true &&
          roomData.phase === "round1",
      );
    }
  };

  // Handle joining existing room
  const handleJoinRoom = async (roomId: string) => {
    await handleJoinRoomWithTimer(roomId);
  };

  // Handle statement submission
  const handleStatementSubmit = useCallback(
    async (text: string) => {
      await submitStatement(text);
    },
    [submitStatement],
  );

  // Handle rant submission
  const handleRantSubmit = useCallback(
    async (text: string) => {
      await submitRant(text);
    },
    [submitRant],
  );

  // Handle voting
  const handleVote = useCallback(
    async (id: string, voteType: VoteType) => {
      await voteOnStatement(id, voteType);
    },
    [voteOnStatement],
  );

  // Advance to the next step in the debate (subphase or round depending on mode)
  const advance = useCallback(async () => {
    if (!room) return;

    const phases: Phase[] = ["round1", "round2", "round3"];
    const subPhases: SubPhase[] = [
      "posting",
      "voting",
      "review",
    ];

    const currentPhaseIndex = phases.indexOf(room.phase);
    const currentSubPhaseIndex = room.subPhase
      ? subPhases.indexOf(room.subPhase)
      : 0;

    // If we're in results, start a new game
    if (room.phase === "results") {
      await updateRoomPhase("round1", "posting");
      setTimerActive(room.mode === "realtime");
      return;
    }

    // For host-controlled mode: single round, advance directly to results
    if (room.mode === "host-controlled") {
      await updateRoomPhase("results", undefined);
      return;
    }

    // For realtime mode: cycle through subphases
    // Move to next sub-phase within current phase
    if (currentSubPhaseIndex < subPhases.length - 1) {
      const nextSubPhase = subPhases[currentSubPhaseIndex + 1];
      await updateRoomPhase(room.phase, nextSubPhase);
      setTimerActive(room.mode === "realtime");
    }
    // Move to next phase
    else if (currentPhaseIndex < phases.length - 1) {
      const nextPhase = phases[currentPhaseIndex + 1];
      await updateRoomPhase(nextPhase, "posting");
      setTimerActive(room.mode === "realtime");
    }
    // Go to results
    else {
      await updateRoomPhase("results", undefined);
      setTimerActive(false);
    }
  }, [room, updateRoomPhase]);

  const startDebate = async () => {
    if (!room) return;

    try {
      setStartingDebate(true);
      await updateRoomPhase("round1", "posting");
      setTimerActive(room.mode === "realtime");
    } finally {
      setStartingDebate(false);
    }
  };

  const handleNewDiscussion = useCallback(
    async (statement: Statement) => {
      if (!user || !room) return;

      try {
        toast.loading("Creating new discussion...");

        // Copy settings from current room
        const roomMode = room.mode;
        const roomRantFirst = room.rantFirst ?? false;

        // Leave current room
        leaveRoom();
        setTimerActive(false);
        clearRoomFromUrl();

        // Create a new room with this statement as the topic, using same settings
        const newRoomData = await createRoom(
          statement.text,
          roomMode, // Copy mode from current room
          roomRantFirst, // Copy rant-first setting from current room
          `Deep dive discussion on: "${statement.text.substring(0, 100)}${statement.text.length > 100 ? "..." : ""}"`,
        );

        if (newRoomData) {
          setTimerActive(
            newRoomData.mode === "realtime" &&
              newRoomData.phase === "round1",
          );
          toast.dismiss();
          const modeText = roomMode === "realtime" ? "Real-time" : "Host-controlled";
          const rantText = roomRantFirst ? " rant-first" : "";
          toast.success(`New ${modeText}${rantText} discussion created! 🔥`);
        } else {
          toast.dismiss();
          toast.error("Failed to create discussion. Please try again.");
        }
      } catch (error) {
        console.error("Error creating new discussion:", error);
        toast.dismiss();
        toast.error("Something went wrong creating the discussion.");
      }
    },
    [user, room, leaveRoom, createRoom],
  );

  const handleScheduleFuture = useCallback(() => {
    alert(
      "Feature coming soon! We'll notify you about upcoming scheduled debates.",
    );
  }, []);

  const handleLeaveRoom = () => {
    leaveRoom();
    setTimerActive(false);
    setTargetRoomId(null); // Clear target room ID to prevent re-joining
    clearRoomFromUrl(); // Clear room from URL when leaving
  };

  const handleLogout = () => {
    resetSession();
    setTimerActive(false);
    setTargetRoomId(null);
    clearRoomFromUrl();
  };

  // Development helper function to jump to final results
  const jumpToFinalResults = async () => {
    if (room) {
      await updateRoomPhase("results", undefined);
    }
  };

  // Check URL for room ID on initial load
  useEffect(() => {
    if (!hasCheckedUrl) {
      const roomIdFromUrl = parseRoomIdFromUrl();
      if (roomIdFromUrl) {
        setTargetRoomId(roomIdFromUrl);
      }
      setHasCheckedUrl(true);
    }
  }, [hasCheckedUrl]);

  // Auto-join room if user exists and there's a target room
  useEffect(() => {
    if (user && targetRoomId && !room) {
      const autoJoinRoom = async () => {
        const roomData =
          await handleJoinRoomWithTimer(targetRoomId);
        if (roomData) {
          setTargetRoomId(null); // Clear target after successful join
        } else {
          // If join failed, clear target and redirect to lobby
          setTargetRoomId(null);
          clearRoomFromUrl();
        }
      };
      autoJoinRoom();
    }
  }, [user, targetRoomId, room, handleJoinRoomWithTimer]);

  // Load active rooms when in lobby (user but no room and no target)
  useEffect(() => {
    if (user && !room && !targetRoomId) {
      getActiveRooms();
    }
  }, [user, room, targetRoomId, getActiveRooms]);

  // Sync timerActive with room phase changes (for real-time multiplayer)
  useEffect(() => {
    if (room) {
      // Activate timer for all sub-phases except lobby and results, but only in realtime mode
      const shouldBeActive =
        room.mode === "realtime" &&
        room.phase !== "lobby" &&
        room.phase !== "results";
      setTimerActive(shouldBeActive);

      // Update URL to reflect current room
      updateUrlForRoom(room.id);
    }
  }, [room?.phase, room?.subPhase, room?.mode, room?.id]);

  // Handle opening and exiting component showcase
  const handleOpenShowcase = () => {
    setShowComponentShowcase(true);
  };

  const handleExitShowcase = () => {
    setShowComponentShowcase(false);
  };

  // Component Showcase Mode - check this first!
  if (showComponentShowcase) {
    return <ComponentShowcase onExit={handleExitShowcase} />;
  }

  // Derived state - single source of truth
  const showNicknameSetup = !user;
  const showLobby = user && !room;
  const showGame = user && room;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
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

  // Nickname Setup
  if (showNicknameSetup) {
    return (
      <>
        <NicknameSetup
          onComplete={handleNicknameComplete}
          loading={loading}
          error={error}
          joiningRoom={!!targetRoomId}
        />
        <Toaster />
      </>
    );
  }

  // Lobby - Room Selection/Creation
  if (showLobby) {
    return (
      <>
        <LobbyScreen
          user={user}
          activeRooms={activeRooms}
          loading={loading}
          error={error}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onRefreshRooms={getActiveRooms}
          onJumpToFinalResults={jumpToFinalResults}
          onCreateSeedData={createSeedData}
          onCreateTestRoom={createTestRoom}
          onCreateRantTestRoom={createRantTestRoom}
          onUpdateRoomDescription={updateRoomDescription}
          onSetRoomInactive={setRoomInactive}
          onLogout={handleLogout}
          onOpenShowcase={handleOpenShowcase}
        />
        <Toaster />
      </>
    );
  }

  // In-Game Experience
  if (showGame) {
    return (
      <>
        <GameScreen
          user={user}
          room={room}
          statements={statements}
          rants={rants}
          timerActive={timerActive}
          lastAchievement={lastAchievement}
          autoPlayActive={autoPlayActive}
          startingDebate={startingDebate}
          onSubmitStatement={handleStatementSubmit}
          onSubmitRant={handleRantSubmit}
          onVote={handleVote}
          onAdvance={advance}
          onStartDebate={startDebate}
          onLeaveRoom={handleLeaveRoom}
          onNewDiscussion={handleNewDiscussion}
          onScheduleFuture={handleScheduleFuture}
          onSkipToNextStep={advance}
          onStartAutoPlay={startAutoPlay}
          onStopAutoPlay={stopAutoPlay}
          onUpdateRoomDescription={updateRoomDescription}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Toaster />
    </>
  );
}