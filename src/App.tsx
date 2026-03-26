import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UnsubscribePage } from "./components/UnsubscribePage";
import { TermsOfServicePage } from "./screens/TermsOfServicePage";
import { PrivacyPolicyPage } from "./screens/PrivacyPolicyPage";
import { OrgsLanding } from "./screens/OrgsLanding";
import { LobbyScreen } from "./screens/LobbyScreen";
import { ComponentShowcase } from "./screens/ComponentShowcase";
import { AdminPanel } from "./components/AdminPanel";
import { AdminDashboard } from "./components/AdminDashboard";
import { FeatureResultsTracker } from "./components/devtools/FeatureResultsTracker";
import { DevTools } from "./components/devtools/DevTools";
import { useDebateSession, DebateSessionProvider } from "./hooks/useDebateSession";
import { Toaster } from "./components/ui/sonner";
import { api } from "./utils/api";
import type { NewDebateRoom, DebateRoom, VoteType } from "./types";
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
import { safelyGetStorageItem } from "./utils/localStorage";

// @ts-ignore
import { toast } from "sonner@2.0.3";

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
    useState(safelyGetStorageItem<boolean>("showComponentShowcase", false));
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] =
    useState(safelyGetStorageItem<boolean>("showAdminDashboard", false));
  const [showFeatureTracker, setShowFeatureTracker] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showOrgsPage, setShowOrgsPage] = useState(false);
  const [qrScanResult, setQrScanResult] =
    useState<QRScanResult | null>(null);

  const {
    user,
    activeRooms,
    currentSubHeard,
    loading,
    error,
    verifyMagicLink,
    createAnonymousUser,
    createRoom,
    joinRoom,
    submitStatement,
    voteOnStatement,
    voteViaFlyer,
    getActiveRooms,
    setCurrentSubHeard,
    resetSession,
    roomStatements,
    submitFlyerEmail,
  } = useDebateSession();

  const handleMagicLinkSuccess = async () => {
    toast.success("Signed in successfully!");
  };

  const handleFlyerJoin = async (flyerData: {
    flyerId: string;
    statementId: string;
    vote: VoteType;
    flyerGroup?: number;
  }) => {
    setIsJoiningAnonymously(true);

    const response = await voteViaFlyer(
      flyerData.flyerId,
      flyerData.statementId,
      flyerData.vote,
      flyerData.flyerGroup,
    );

    if (!response || !response.user) {
      toast.error("Failed to process flyer vote");
    } else {
      setTargetRoomId(response.room.id);
      setQrScanResult(response);
    }

    setIsJoiningAnonymously(false);
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

  const handleQrEmailSubmit = async (email: string) => {
    const response = await submitFlyerEmail(email);
    if (response?.success) {
      setTargetRoomId(qrScanResult!.room.id);
      updateUrlForRoom(qrScanResult!.room.id);
      setQrScanResult(null);
      toast.success("Welcome to Heard! 🎉");
    }
  };

  const handleLogout = () => {
    resetSession();
    setTargetRoomId(null);
    clearRoomFromUrl();
  };

  const loginViaMagicTokenInUrl = async (magicToken: string) => {
    const response = await verifyMagicLink(magicToken);
    if (response && response.success) {
      handleMagicLinkSuccess();
    }

    window.history.pushState({}, "", "/");
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

      const anonUserResponse = await createAnonymousUser();
      if (anonUserResponse && anonUserResponse.success) {
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
      const magicTokenFromUrl = urlParams.get("token");
      const isMagicLinkRoute =
        window.location.pathname.startsWith("/magic-link");
      const isAdminRoute =
        window.location.pathname.startsWith("/admin");
      const isDevToolsRoute =
        window.location.pathname.startsWith("/devtools");
      const isUnsubscribeRoute =
        window.location.pathname.startsWith("/unsubscribe");
      const isTermsRoute =
        window.location.pathname.startsWith("/terms");
      const isPrivacyRoute =
        window.location.pathname.startsWith("/privacy");
      const isOrgsRoute =
        window.location.pathname.startsWith("/orgs");

      const isParkletRoute =
        window.location.pathname.startsWith("/parklet");

      const roomIdFromUrl = parseRoomIdFromUrl();
      const subHeardFromUrl = parseSubHeardFromUrl();
      const analysisRoomIdFromUrl =
        parseAnalysisRoomIdFromUrl();
      const flyerDataFromUrl = parseFlyerDataFromUrl();

      if (analysisRoomIdFromUrl) {
        setAnalysisRoomId(analysisRoomIdFromUrl);
      }

      if (isMagicLinkRoute && magicTokenFromUrl) {
        loginViaMagicTokenInUrl(magicTokenFromUrl);
      } else if (isUnsubscribeRoute) {
        setShowUnsubscribe(true);
      } else if (isAdminRoute) {
        setShowAdminPanel(true);
      } else if (isDevToolsRoute) {
        setShowDevTools(true);
      } else if (isParkletRoute) {
        const hardcodedRoomId = "aocxafg7tnpmmv7j6sh";

        if (!hardcodedRoomId) {
          toast.error("Invalid route");
        } else if (user) {
          setTargetRoomId(hardcodedRoomId);
        } else {
          autoJoinAsAnonymous(hardcodedRoomId);
        }
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
      } else if (isTermsRoute) {
        setShowTerms(true);
      } else if (isPrivacyRoute) {
        setShowPrivacy(true);
      } else if (isOrgsRoute) {
        setShowOrgsPage(true);
      }
      setHasCheckedUrl(true);
    }
  }, [hasCheckedUrl, setCurrentSubHeard, user, loading]);

  useEffect(() => {
    if (
      !user &&
      hasCheckedUrl &&
      !showUnsubscribe &&
      !showAdminPanel &&
      !showDevTools &&
      !isJoiningAnonymously
    ) {
      const autoCreateAnonymousUser = async () => {
        setIsJoiningAnonymously(true);
        await createAnonymousUser();
        setIsJoiningAnonymously(false);
      };
      autoCreateAnonymousUser();
    }
  }, [
    user,
    hasCheckedUrl,
    showUnsubscribe,
    showAdminPanel,
    showDevTools,
    isJoiningAnonymously,
    createAnonymousUser,
  ]);

  useEffect(() => {
    const autoJoinSubHeard = async () => {
      if (user && currentSubHeard && hasCheckedUrl) {
        try {
          const response = await api.joinSubHeard(currentSubHeard);

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

  const handleOpenFeatureTracker = () => {
    setShowFeatureTracker(true);
    window.history.pushState({}, "", "/features");
  };

  const handleExitFeatureTracker = () => {
    setShowFeatureTracker(false);
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

  const handleExitOrgs = () => {
    setShowOrgsPage(false);
    window.history.pushState({}, "", "/");
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

  if (showFeatureTracker) {
    return (
      <>
        <FeatureResultsTracker onExit={handleExitFeatureTracker} />
        <Toaster />
      </>
    );
  }

  if (showDevTools) {
    if (!user) {
      return null;
    }
    return (
      <>
        <DevTools user={user} onExit={handleExitDevTools} />
        <Toaster />
      </>
    );
  }

  if (showComponentShowcase) {
    return <ComponentShowcase onExit={handleExitShowcase} />;
  }

  if (showUnsubscribe) {
    return <UnsubscribePage />;
  }

  if (showTerms) {
    return <TermsOfServicePage />;
  }

  if (showPrivacy) {
    return <PrivacyPolicyPage />;
  }

  if (showOrgsPage) {
    return <OrgsLanding onExit={handleExitOrgs} />;
  }

  if (!user || loading || isJoiningAnonymously) {
    return (
      <div className="heard-page-bg heard-center">
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
        hasQrScanResult={!!qrScanResult}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onRefreshRooms={getActiveRooms}
        onSubmitStatement={submitStatement}
        onVoteOnStatement={voteOnStatement}
        onLogout={handleLogout}
        onOpenShowcase={handleOpenShowcase}
        onOpenAdminPanel={handleOpenAdminPanel}
        onOpenAdminDashboard={handleOpenAdminDashboard}
        onOpenFeatureTracker={handleOpenFeatureTracker}
        onOpenDevTools={handleOpenDevTools}
        onSubHeardChange={handleSubHeardChange}
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
          onEmailSubmit={handleQrEmailSubmit}
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