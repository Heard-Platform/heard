import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { LandingPage } from "./screens/LandingPage";
import { PasswordReset } from "./components/PasswordReset";
import { UnsubscribePage } from "./components/UnsubscribePage";
import { LobbyScreen } from "./screens/LobbyScreen";
import { ComponentShowcase } from "./screens/ComponentShowcase";
import { AdminPanel } from "./components/AdminPanel";
import { AdminDashboard } from "./components/AdminDashboard";
import { DevTools } from "./components/devtools/DevTools";
import { useDebateSession, DebateSessionProvider } from "./hooks/useDebateSession";
import { Toaster } from "./components/ui/sonner";
import { api, getUserId, setUserId } from "./utils/api";
import type { NewDebateRoom, DebateRoom, VoteType, UserSession } from "./types";
import {
  parseRoomIdFromUrl,
  parseSubHeardFromUrl,
  updateUrlForSubHeard,
  clearRoomFromUrl,
  parseAnalysisRoomIdFromUrl,
  updateUrlForDevTools,
  parseFlyerDataFromUrl,
  updateUrlForRoom
} from "./utils/url";
import { QRScanResult, QRScanResultDialog } from "./components/room/QRScanResultDialog";

// @ts-ignore
import { toast } from "sonner@2.0.3";

function getStoredDashboardState(): boolean {
  try {
    return (
      localStorage.getItem("showAdminDashboard") === "true"
    );
  } catch {
    return false;
  }
}

function AppContent() {
  const [targetRoomId, setTargetRoomId] = useState<
    string | null
  >(null);
  const [analysisRoomId, setAnalysisRoomId] = useState<
    string | null
  >(null);
  const [hasCheckedUrl, setHasCheckedUrl] = useState(false);
  const [isJoiningAnonymously, setIsJoiningAnonymously] = useState(false);
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
  const [showAdminDashboard, setShowAdminDashboard] = useState(
    getStoredDashboardState,
  );
  const [showDevTools, setShowDevTools] = useState(false);
  const [showPasswordReset, setShowPasswordReset] =
    useState(false);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(
    null,
  );
  const [magicLinkToken, setMagicLinkToken] = useState<string | null>(
    null,
  );
  const [qrScanResult, setQrScanResult] =
    useState<QRScanResult | null>(null);

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
    voteViaFlyer,
    getActiveRooms,
    setCurrentSubHeard,
    resetSession,
    roomStatements,
    getAllRoomStatements,
  } = useDebateSession();

  const handleNicknameComplete = async (
    nickname: string,
    email: string,
    password: string,
    isSignIn: boolean,
  ) => {
    await initializeUser(nickname, email, password, isSignIn);

    if (targetRoomId) {
      const roomData = await joinRoom(targetRoomId);
      if (roomData) {
        if (roomData.subHeard) {
          setCurrentSubHeard(roomData.subHeard);
        }
        setTargetRoomId(null);
      }
    }
  };

  const handleMagicLinkSuccess = async (userId: string, userData: UserSession) => {
    setUserId(userId);
    await initializeUser("", "", "", false, userData);
    toast.success("Signed in successfully!");
  };

  const handleAnonymousJoinDev = async (anonymousLinkIdFromUrl: string) => {
  try {
    setIsJoiningAnonymously(true);
    const response = await api.joinViaAnonymousLink(anonymousLinkIdFromUrl) as any;
    if (response.success && response.data) {
      const { user: anonUser, roomId, subHeard } = response.data;
      setUserId(anonUser.id);
      await initializeUser("", "", "", false, anonUser);
      if (subHeard) {
        setCurrentSubHeard(subHeard);
      }
      setTargetRoomId(roomId);
    } else {
      console.error("Failed to join via anonymous link:", response.error);
      setIsJoiningAnonymously(false);
    }
  } catch (error) {
    console.error("Error joining via anonymous link:", error);
    setIsJoiningAnonymously(false);
  }
};

  const handleFlyerJoin = async (flyerData: { flyerId: string; statementId: string; vote: VoteType }) => {
    try {
      setIsJoiningAnonymously(true);
      const existingUserId = getUserId();
      
      const response = await voteViaFlyer(
        flyerData.flyerId,
        flyerData.statementId,
        flyerData.vote,
        existingUserId || undefined
      );

      const { user: flyerUser, room } = response;
        
      if (!flyerUser) {
        console.error("No userId or user in flyer response");
        toast.error("Failed to process flyer vote");
        setIsJoiningAnonymously(false);
        return;
      }
      
      setUserId(flyerUser.id);
      await initializeUser("", "", "", false, flyerUser);
      
      setTargetRoomId(room.id);
      setQrScanResult(response);
    } catch (error) {
      console.error("Error voting via flyer:", error);
      toast.error("Failed to process flyer vote");
      setIsJoiningAnonymously(false);
    }
  };

  const handleCreateRoom = async (
    newDebate: NewDebateRoom,
  ): Promise<DebateRoom> => {
    const roomData = await createRoom(newDebate);
    await getActiveRooms();
    setCurrentSubHeard(roomData.subHeard || null);
    return roomData;
  };

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

  const autoJoinAsAnonymous = async (roomIdFromUrl: string) => {
    setTargetRoomId(roomIdFromUrl);
    try {
      setIsJoiningAnonymously(true);
      const response = await api.getRoomStatus(roomIdFromUrl);

      if (!response.success || !response.data) {
        toast.error("Room not found");
        setIsJoiningAnonymously(false);
        return;
      }

      const room = response.data.room;

      if (!room.allowAnonymous) {
        setIsJoiningAnonymously(false);
        return;
      }

      const anonUserResponse = await api.createAnonymousUser();
      if (anonUserResponse.success && anonUserResponse.data) {
        const anonUser = anonUserResponse.data;
        setUserId(anonUser.id);
        await initializeUser("", "", "", false, anonUser);

        if (room.subHeard) {
          setCurrentSubHeard(room.subHeard);
        }
      } else {
        setIsJoiningAnonymously(false);
      }
    } catch (error) {
      console.error("Error auto-joining as anonymous:", error);
      setIsJoiningAnonymously(false);
    }
  };

  useEffect(() => {
    if (!hasCheckedUrl && !loading) {
      const urlParams = new URLSearchParams(
        window.location.search,
      );
      const resetTokenFromUrl = urlParams.get("resetToken");
      const magicTokenFromUrl = urlParams.get("token");
      const isMagicLinkRoute =
        window.location.pathname.startsWith("/magic-link");
      const isAdminRoute =
        window.location.pathname.startsWith("/admin");
      const isDevToolsRoute =
        window.location.pathname.startsWith("/devtools");
      const isUnsubscribeRoute =
        window.location.pathname.startsWith("/unsubscribe");
      const roomIdFromUrl = parseRoomIdFromUrl();
      const subHeardFromUrl = parseSubHeardFromUrl();
      const analysisRoomIdFromUrl =
        parseAnalysisRoomIdFromUrl();
      const flyerDataFromUrl = parseFlyerDataFromUrl();

      if (analysisRoomIdFromUrl) {
        setAnalysisRoomId(analysisRoomIdFromUrl);
      }

      if (resetTokenFromUrl) {
        setResetToken(resetTokenFromUrl);
        setShowPasswordReset(true);
      } else if (isMagicLinkRoute && magicTokenFromUrl) {
        setMagicLinkToken(magicTokenFromUrl);
      } else if (isUnsubscribeRoute) {
        setShowUnsubscribe(true);
      } else if (isAdminRoute) {
        setShowAdminPanel(true);
      } else if (isDevToolsRoute) {
        setShowDevTools(true);
      } else if (flyerDataFromUrl) {
        handleFlyerJoin(flyerDataFromUrl);
      } else if (roomIdFromUrl) {
        if (user) {
          setTargetRoomId(roomIdFromUrl);
        } else {
          autoJoinAsAnonymous(roomIdFromUrl);
        }
      } else if (subHeardFromUrl) {
        setCurrentSubHeard(subHeardFromUrl);
      }
      setHasCheckedUrl(true);
    }
  }, [hasCheckedUrl, setCurrentSubHeard, user, loading]);

  useEffect(() => {
    const autoJoinSubHeard = async () => {
      if (user && currentSubHeard && hasCheckedUrl) {
        try {
          const response = await api.joinSubHeard(
            currentSubHeard,
            user.id,
          );

          if (!response.success) {
            toast.error("Unable to join this community");
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

  useEffect(() => {
    if (user && targetRoomId) {
      const autoJoinRoom = async () => {
        const roomData = await joinRoom(targetRoomId);
        if (roomData) {
          if (
            roomData.subHeard &&
            roomData.subHeard !== currentSubHeard
          ) {
            setCurrentSubHeard(roomData.subHeard);
          }
          setIsJoiningAnonymously(false);
        } else {
          setTargetRoomId(null);
          clearRoomFromUrl();
          setIsJoiningAnonymously(false);
        }
      };
      autoJoinRoom();
    }
  }, [user, targetRoomId]);

  useEffect(() => {
    if (user && hasCheckedUrl) {
      getActiveRooms();
    }
  }, [user, currentSubHeard, getActiveRooms, hasCheckedUrl]);

  useEffect(() => {
    const handleMagicLinkLogin = async () => {
      if (magicLinkToken && !user) {
        try {
          const response = await api.verifyMagicLink(magicLinkToken);
          if (response.success && response.data) {
            handleMagicLinkSuccess(response.data.user.id, response.data.user);
            window.history.pushState({}, "", "/");
          } else {
            toast.error(response.error || "Invalid or expired magic link");
            window.history.pushState({}, "", "/");
          }
        } catch (error) {
          console.error("Error verifying magic link:", error);
          toast.error("Failed to verify magic link");
          window.history.pushState({}, "", "/");
        } finally {
          setMagicLinkToken(null);
        }
      }
    };
    handleMagicLinkLogin();
  }, [magicLinkToken, user, initializeUser]);

  const handleOpenShowcase = () => {
    setShowComponentShowcase(true);
    localStorage.setItem("showComponentShowcase", "true");
  };

  const handleExitShowcase = () => {
    setShowComponentShowcase(false);
    localStorage.setItem("showComponentShowcase", "false");
  };

  const handleOpenAdminPanel = () => {
    setShowAdminPanel(true);
    window.history.pushState({}, "", "/admin");
  };

  const handleExitAdminPanel = () => {
    setShowAdminPanel(false);
    window.history.pushState({}, "", "/");
  };

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

  const handleOpenDevTools = () => {
    setShowDevTools(true);
    updateUrlForDevTools("clustering");
  };

  const handleExitDevTools = () => {
    setShowDevTools(false);
    updateUrlForDevTools(null);
  };

  if (showAdminPanel) {
    return (
      <>
        <AdminPanel onExit={handleExitAdminPanel} />
        <Toaster />
      </>
    );
  }

  if (showAdminDashboard && user) {
    return (
      <>
        <AdminDashboard
          onExit={handleExitAdminDashboard}
          currentUserId={user.id}
        />
        <Toaster />
      </>
    );
  }

  if (showDevTools) {
    if (!user) {
      return null;
    }
    return <DevTools user={user} onExit={handleExitDevTools} />;
  }

  if (showComponentShowcase) {
    return <ComponentShowcase onExit={handleExitShowcase} />;
  }

  if (showPasswordReset) {
    return (
      <>
        <PasswordReset
          onBack={() => {
            setShowPasswordReset(false);
            setResetToken(null);
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

  if (showUnsubscribe) {
    return <UnsubscribePage />;
  }

  const showNicknameSetup = !user;

  if (loading || isJoiningAnonymously) {
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

  if (showNicknameSetup) {
    return (
      <>
        <LandingPage
          loading={loading}
          error={error || ""}
          joiningRoom={!!targetRoomId}
          onComplete={handleNicknameComplete}
          onForgotPassword={() => setShowPasswordReset(true)}
          onJoinAnonymousLink={handleAnonymousJoinDev}
          onMagicLinkSuccess={handleMagicLinkSuccess}
        />
        <Toaster />
      </>
    );
  }

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
        onLogout={handleLogout}
        onOpenShowcase={handleOpenShowcase}
        onOpenAdminPanel={handleOpenAdminPanel}
        onOpenAdminDashboard={handleOpenAdminDashboard}
        onOpenDevTools={handleOpenDevTools}
        onSubHeardChange={handleSubHeardChange}
        onGetAllRoomStatements={getAllRoomStatements}
      />
      <Toaster />
      {qrScanResult && (
        <QRScanResultDialog
          room={qrScanResult.room}
          agreePercent={qrScanResult.agreePercent}
          disagreePercent={qrScanResult.disagreePercent}
          passPercent={qrScanResult.passPercent}
          userVote={qrScanResult.userVote}
          isOpen={true}
          onJoinDiscussion={() => {
            setTargetRoomId(qrScanResult.room.id);
            updateUrlForRoom(qrScanResult.room.id);
            setQrScanResult(null);
          }}
          onClose={() => setQrScanResult(null)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <DebateSessionProvider>
      <AppContent />
    </DebateSessionProvider>
  );
}