import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { NicknameSetup } from "./components/NicknameSetup";
import { PasswordReset } from "./components/PasswordReset";
import { LobbyScreen } from "./screens/LobbyScreen";
import { ComponentShowcase } from "./screens/ComponentShowcase";
import { AdminPanel } from "./components/AdminPanel";
import { useDebateSession } from "./hooks/useDebateSession";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { api } from "./utils/api";
import {
  parseRoomIdFromUrl,
  parseSubHeardFromUrl,
  parseAccessTokenFromUrl,
  updateUrlForSubHeard,
  clearRoomFromUrl,
} from "./utils/url";

export default function App() {
  const [targetRoomId, setTargetRoomId] = useState<
    string | null
  >(null);
  const [hasCheckedUrl, setHasCheckedUrl] = useState(false);
  const [showComponentShowcase, setShowComponentShowcase] =
    useState(() => {
      // Check localStorage on mount
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
    getActiveRooms,
    setCurrentSubHeard,
    resetSession,
    createSeedData,
    createTestRoom,
    createRantTestRoom,
    createRealtimeTestRoom,
    setRoomInactive,
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
    topic: string,
    mode: "realtime" | "host-controlled",
    rantFirst?: boolean,
    description?: string,
    subHeard?: string,
    seedStatements?: string[],
  ) => {
    const roomData = await createRoom(
      topic,
      mode,
      rantFirst,
      description,
      subHeard,
      false, // Don't auto-join - stay on TikTok scroller
      seedStatements,
    );

    // Refresh the rooms list to show the newly created room
    if (roomData) {
      getActiveRooms();
    }
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

  // Check URL for room ID, sub-heard, access token, or reset token on initial load
  useEffect(() => {
    if (!hasCheckedUrl) {
      const urlParams = new URLSearchParams(
        window.location.search,
      );
      const resetTokenFromUrl = urlParams.get("resetToken");
      const roomIdFromUrl = parseRoomIdFromUrl();
      const subHeardFromUrl = parseSubHeardFromUrl();

      if (resetTokenFromUrl) {
        setResetToken(resetTokenFromUrl);
        setShowPasswordReset(true);
      } else if (roomIdFromUrl) {
        setTargetRoomId(roomIdFromUrl);
      } else if (subHeardFromUrl) {
        setCurrentSubHeard(subHeardFromUrl);
      }
      setHasCheckedUrl(true);
    }
  }, [hasCheckedUrl, setCurrentSubHeard]);

  // Auto-join sub-heard when user visits its URL with access token
  useEffect(() => {
    const autoJoinSubHeard = async () => {
      if (user && currentSubHeard && hasCheckedUrl) {
        try {
          // Get access token from URL if present
          const accessToken = parseAccessTokenFromUrl();

          // Idempotent join - will add membership if private and access token is valid
          // For public sub-heards, this just returns success
          const response = await api.joinSubHeard(
            currentSubHeard,
            user.id,
            accessToken || undefined,
          );

          if (!response.success) {
            // Any error means access token issue for private community
            toast.error(
              "Invalid or missing access code for this private community",
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
  }, [user, currentSubHeard, hasCheckedUrl, setCurrentSubHeard]);

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
          setTargetRoomId(null); // Clear target after successful join
        } else {
          // If join failed, clear target and redirect to lobby
          setTargetRoomId(null);
          clearRoomFromUrl();
        }
      };
      autoJoinRoom();
    }
  }, [
    user,
    targetRoomId,
    joinRoom,
    currentSubHeard,
    setCurrentSubHeard,
  ]);

  // Load active rooms when in lobby (user but no target)
  useEffect(() => {
    if (user && !targetRoomId) {
      getActiveRooms();
    }
  }, [user, targetRoomId, currentSubHeard, getActiveRooms]);

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
  };

  const handleExitAdminPanel = () => {
    setShowAdminPanel(false);
  };

  // Check for admin panel URL parameter (for direct access)
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminModeUrl = urlParams.get("admin") === "true";

  // Admin Panel Mode - check this first!
  if (showAdminPanel || isAdminModeUrl) {
    return (
      <>
        <AdminPanel onExit={handleExitAdminPanel} />
        <Toaster />
      </>
    );
  }

  // Component Showcase Mode - check this second!
  if (showComponentShowcase) {
    return <ComponentShowcase onExit={handleExitShowcase} />;
  }

  // Password Reset Mode - check this third!
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
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onRefreshRooms={getActiveRooms}
        onCreateSeedData={createSeedData}
        onCreateTestRoom={createTestRoom}
        onCreateRantTestRoom={createRantTestRoom}
        onCreateRealtimeTestRoom={createRealtimeTestRoom}
        onSetRoomInactive={setRoomInactive}
        onLogout={handleLogout}
        onOpenShowcase={handleOpenShowcase}
        onOpenAdminPanel={handleOpenAdminPanel}
        currentSubHeard={currentSubHeard || undefined}
        onSubHeardChange={handleSubHeardChange}
      />
      <Toaster />
    </>
  );
}
