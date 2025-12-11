import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { NicknameSetup } from "./components/NicknameSetup";
import { PasswordReset } from "./components/PasswordReset";
import { LobbyScreen } from "./screens/LobbyScreen";
import { ComponentShowcase } from "./screens/ComponentShowcase";
import { AdminPanel } from "./components/AdminPanel";
import { AdminDashboard } from "./components/AdminDashboard";
import { DevTools } from "./components/DevTools";
import { useDebateSession } from "./hooks/useDebateSession";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { api } from "./utils/api";
import type { NewDebateRoom, DebateRoom } from "./types";
import {
  parseRoomIdFromUrl,
  parseSubHeardFromUrl,
  updateUrlForSubHeard,
  clearRoomFromUrl,
  parseAnalysisRoomIdFromUrl,
} from "./utils/url";

function getStoredDashboardState(): boolean {
  try {
    return localStorage.getItem("showAdminDashboard") === "true";
  } catch {
    return false;
  }
}

function getStoredDevToolsState(): boolean {
  try {
    return localStorage.getItem("showDevTools") === "true";
  } catch {
    return false;
  }
}

export default function App() {
  const [targetRoomId, setTargetRoomId] = useState<
    string | null
  >(null);
  const [analysisRoomId, setAnalysisRoomId] = useState<
    string | null
  >(null);
  const [hasCheckedUrl, setHasCheckedUrl] = useState(false);
  const [showComponentShowcase, setShowComponentShowcase] =
    useState(() => {
      try {
        return (
          localStorage.getItem("showComponentShowcase") ===
          "true"
        );
      } catch {
        return false;
      }
    });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(getStoredDashboardState);
  const [showDevTools, setShowDevTools] = useState(getStoredDevToolsState);
  const [showPasswordReset, setShowPasswordReset] =
    useState(false);
  const [resetToken, setResetToken] = useState<string | null>(
    null,
  );

  const {
    user,
    activeRooms,
    currentSubHeard,
    loading,
    error,
    initializeUser,
    createRoom,
    joinRoom,
    submitStatement,
    voteOnStatement,
    getActiveRooms,
    setCurrentSubHeard,
    resetSession,
    createSeedData,
    createTestRoom,
    createRantTestRoom,
    createRealtimeTestRoom,
    setRoomInactive,
    roomStatements,
    getRoomStatements,
    getAllRoomStatements,
  } = useDebateSession();

  // Handle nickname setup completion
  const handleNicknameComplete = async (
    nickname: string,
    email: string,
    password: string,
    isSignIn: boolean,
  ) => {
    await initializeUser(nickname, email, password, isSignIn);

    // If there's a target room ID, join it after user creation
    if (targetRoomId) {
      const roomData = await joinRoom(targetRoomId);
      if (roomData) {
        // Set community context to match room's community
        if (roomData.subHeard) {
          setCurrentSubHeard(roomData.subHeard);
        }
        setTargetRoomId(null);
      }
    }
  };

  // Handle room creation
  const handleCreateRoom = async (
    newDebate: NewDebateRoom,
  ): Promise<DebateRoom> => {
    const roomData = await createRoom(newDebate);

    // Refresh the rooms list to show the newly created room
    getActiveRooms();
    
    return roomData; // Return room data for share step
  };

  // Handle joining existing room
  const handleJoinRoom = async (roomId: string) => {
    await joinRoom(roomId);
  };

  const handleSubHeardChange = (subHeard: string | null) => {
    setCurrentSubHeard(subHeard);
    updateUrlForSubHeard(subHeard);
  };

  const handleLogout = () => {
    resetSession();
    setTargetRoomId(null);
    clearRoomFromUrl();
  };

  // Check URL for room ID, sub-heard, or reset token on initial load
  useEffect(() => {
    if (!hasCheckedUrl) {
      const urlParams = new URLSearchParams(
        window.location.search,
      );
      const resetTokenFromUrl = urlParams.get("resetToken");
      const isAdminRoute = window.location.pathname === "/admin";
      const roomIdFromUrl = parseRoomIdFromUrl();
      const subHeardFromUrl = parseSubHeardFromUrl();
      const analysisRoomIdFromUrl = parseAnalysisRoomIdFromUrl();

      if (analysisRoomIdFromUrl) {
        setAnalysisRoomId(analysisRoomIdFromUrl);
      }

      if (resetTokenFromUrl) {
        setResetToken(resetTokenFromUrl);
        setShowPasswordReset(true);
      } else if (isAdminRoute) {
        setShowAdminPanel(true);
      } else if (roomIdFromUrl) {
        setTargetRoomId(roomIdFromUrl);
      } else if (subHeardFromUrl) {
        setCurrentSubHeard(subHeardFromUrl);
      }
      setHasCheckedUrl(true);
    }
  }, [hasCheckedUrl, setCurrentSubHeard]);

  // Auto-join sub-heard when user visits its URL
  useEffect(() => {
    const autoJoinSubHeard = async () => {
      if (user && currentSubHeard && hasCheckedUrl) {
        try {
          // Auto-join on visit - no access token needed
          // If you have the link, you can join
          const response = await api.joinSubHeard(
            currentSubHeard,
            user.id,
          );

          if (!response.success) {
            // Error joining (e.g., community doesn't exist)
            toast.error(
              "Unable to join this community",
            );
            setCurrentSubHeard(null);
            updateUrlForSubHeard(null);
          }
        } catch (error) {
          console.error("Error auto-joining sub-heard:", error);
        }
      }
    };
    autoJoinSubHeard();
  }, [
    user,
    currentSubHeard,
    hasCheckedUrl,
    setCurrentSubHeard,
  ]);

  // Auto-join room if user exists and there's a target room
  useEffect(() => {
    if (user && targetRoomId) {
      const autoJoinRoom = async () => {
        const roomData = await joinRoom(targetRoomId);
        if (roomData) {
          // Set the community context to match the room's community
          if (
            roomData.subHeard &&
            roomData.subHeard !== currentSubHeard
          ) {
            setCurrentSubHeard(roomData.subHeard);
          }
        } else {
          // If join failed, clear target and redirect to lobby
          setTargetRoomId(null);
          clearRoomFromUrl();
        }
      };
      autoJoinRoom();
    }
  }, [user, targetRoomId]);

  // Load active rooms when in lobby
  useEffect(() => {
    if (user) {
      getActiveRooms();
    }
  }, [user, currentSubHeard, getActiveRooms]);

  // Handle opening and exiting component showcase
  const handleOpenShowcase = () => {
    setShowComponentShowcase(true);
    localStorage.setItem("showComponentShowcase", "true");
  };

  const handleExitShowcase = () => {
    setShowComponentShowcase(false);
    localStorage.setItem("showComponentShowcase", "false");
  };

  // Handle opening and exiting admin panel
  const handleOpenAdminPanel = () => {
    setShowAdminPanel(true);
    window.history.pushState({}, "", "/admin");
  };

  const handleExitAdminPanel = () => {
    setShowAdminPanel(false);
    window.history.pushState({}, "", "/");
  };

  // Handle opening and exiting admin dashboard
  const handleOpenAdminDashboard = () => {
    setShowAdminDashboard(true);
    localStorage.setItem("showAdminDashboard", "true");
    window.history.pushState({}, "", "/dashboard");
  };

  const handleExitAdminDashboard = () => {
    setShowAdminDashboard(false);
    localStorage.setItem("showAdminDashboard", "false");
    window.history.pushState({}, "", "/");
  };

  // Handle opening and exiting dev tools
  const handleOpenDevTools = () => {
    setShowDevTools(true);
    localStorage.setItem("showDevTools", "true");
    window.history.pushState({}, "", "/devtools");
  };

  const handleExitDevTools = () => {
    setShowDevTools(false);
    localStorage.setItem("showDevTools", "false");
    window.history.pushState({}, "", "/");
  };

  // Admin Panel Mode - check this first!
  if (showAdminPanel) {
    return (
      <>
        <AdminPanel onExit={handleExitAdminPanel} />
        <Toaster />
      </>
    );
  }

  // Admin Dashboard Mode - check this second!
  if (showAdminDashboard && user) {
    return (
      <>
        <AdminDashboard onExit={handleExitAdminDashboard} currentUserId={user.id} />
        <Toaster />
      </>
    );
  }

  // Dev Tools Mode - check this third!
  if (showDevTools) {
    return <DevTools onExit={handleExitDevTools} />;
  }

  // Component Showcase Mode - check this fourth!
  if (showComponentShowcase) {
    return <ComponentShowcase onExit={handleExitShowcase} />;
  }

  // Password Reset Mode - check this fifth!
  if (showPasswordReset) {
    return (
      <>
        <PasswordReset
          onBack={() => {
            setShowPasswordReset(false);
            setResetToken(null);
            // Clear reset token from URL
            const url = new URL(window.location.href);
            url.searchParams.delete("resetToken");
            window.history.replaceState({}, "", url.toString());
          }}
          initialToken={resetToken || undefined}
        />
        <Toaster />
      </>
    );
  }

  // Show nickname setup if no user
  const showNicknameSetup = !user;

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
          onForgotPassword={() => setShowPasswordReset(true)}
          loading={loading}
          error={error}
          joiningRoom={!!targetRoomId}
        />
        <Toaster />
      </>
    );
  }

  // Lobby - Room Selection/Creation (always show when user exists)
  return (
    <>
      <LobbyScreen
        user={user}
        activeRooms={activeRooms}
        loading={loading}
        error={error}
        currentSubHeard={currentSubHeard || undefined}
        roomStatements={roomStatements}
        targetRoomId={targetRoomId || undefined}
        analysisRoomId={analysisRoomId || undefined}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onRefreshRooms={getActiveRooms}
        onSubmitStatement={submitStatement}
        onVoteOnStatement={voteOnStatement}
        onCreateSeedData={createSeedData}
        onCreateTestRoom={createTestRoom}
        onCreateRantTestRoom={createRantTestRoom}
        onCreateRealtimeTestRoom={createRealtimeTestRoom}
        onSetRoomInactive={setRoomInactive}
        onLogout={handleLogout}
        onOpenShowcase={handleOpenShowcase}
        onOpenAdminPanel={handleOpenAdminPanel}
        onOpenAdminDashboard={handleOpenAdminDashboard}
        onOpenDevTools={handleOpenDevTools}
        onSubHeardChange={handleSubHeardChange}
        onGetRoomStatements={getRoomStatements}
        onGetAllRoomStatements={getAllRoomStatements}
      />
      <Toaster />
    </>
  );
}