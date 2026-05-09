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
import { NewsletterViewer } from "./components/NewsletterViewer";
import { useDebateSession, DebateSessionProvider } from "./hooks/useDebateSession";
import { Toaster } from "./components/ui/sonner";
import { api } from "./utils/api";
import type { NewDebateRoom, DebateRoom, VoteType, Event } from "./types";
import {
  parseRoomIdFromUrl,
  parseSubHeardFromUrl,
  updateUrlForSubHeard,
  clearRoomFromUrl,
  parseAnalysisRoomIdFromUrl,
  updateUrlForDevTools,
  parseFlyerDataFromUrl,
  updateUrlForRoom,
  parseEventIdFromUrl,
  updateUrlForEvent,
} from "./utils/url";
import { QRScanResult, QRScanResultDialog } from "./components/room/QRScanResultDialog";
import { safelyGetStorageItem } from "./utils/localStorage";

// @ts-ignore
import { toast } from "sonner@2.0.3";

const KALORAMA_ROOM_ID = "xo38wmfkm7bmo35js4i";
const KALORAMA_COMMUNITIES = ["kalorama-park", "dupont-circle-neighborhoods", "washington-dc"];

const SHIRT_FLYER_ID = "anwf2hrhubdmoyd0uh2";
const SHIRT_STATEMENT_ID = "orgi27e8jipmoyd0uhl";

const I_LOVE_CIVTECH_FLYER_ID = "gv7kmooa0lmom3pn2m";
const I_LOVE_CIVTECH_STATEMENT_ID = "jg46pxp4fsmom3pn3c";

const HARDCODED_FLYER_ROUTES: Record<string, { flyerId: string; statementId: string }> = {
  shirt: { flyerId: SHIRT_FLYER_ID, statementId: SHIRT_STATEMENT_ID },
  sign: { flyerId: I_LOVE_CIVTECH_FLYER_ID, statementId: I_LOVE_CIVTECH_STATEMENT_ID },
  card: { flyerId: I_LOVE_CIVTECH_FLYER_ID, statementId: I_LOVE_CIVTECH_STATEMENT_ID },
};

function AppContent() {
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState<
    string | null
  >(null);
  const [pendingCommunities, setPendingCommunities] = useState<string[]>([]);
  const [pendingFlyerScan, setPendingFlyerScan] = useState<string | null>(null);
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
  const [newsletterEdition, setNewsletterEdition] = useState<number | null>(null);
  const [qrScanResult, setQrScanResult] =
    useState<QRScanResult | null>(null);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(false);

  const {
    user,
    activeRooms,
    currentSubHeard,
    loading,
    roomsLoading,
    error,
    verifyMagicLink,
    createAnonymousUser,
    createRoom,
    joinRoom,
    joinSubHeard,
    submitStatement,
    voteOnStatement,
    voteViaFlyer,
    getActiveRooms,
    setCurrentSubHeard,
    resetSession,
    roomStatements,
    anonAddEmailAndLogin,
  } = useDebateSession();

  const startRoomJoin = (roomId: string) => {
    setIsJoiningRoom(true);
    setTargetRoomId(roomId);
  }

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
      startRoomJoin(response.room.id);
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
    if (user?.isAnonymous && email) {
      const response = await anonAddEmailAndLogin(email);
      if (!response?.success) throw new Error(response?.error || "Unknown error");
      toast.success("Welcome to Heard! 🎉");
    }
    updateUrlForRoom(qrScanResult!.room.id);
    setQrScanResult(null);
  };

  const handleLogout = () => {
    resetSession();
    setTargetRoomId(null);
    clearRoomFromUrl();
  };

  const handleOpenEvent = (eventId: string) => {
    setCurrentEventId(eventId);
    updateUrlForEvent(eventId);
  };

  const handleExitEvent = () => {
    setCurrentEventId(null);
    setCurrentEvent(null);
    updateUrlForEvent(null);
  };

  const fetchEvent = async (eventId: string) => {
    setEventLoading(true);
    const response = await api.getEvent(eventId);
    if (response.success && response.data) {
      setCurrentEvent(response.data.event);
    }
    setEventLoading(false);
  };

  useEffect(() => {
    if (!currentEventId) return;
    fetchEvent(currentEventId);
  }, [currentEventId]);

  const handleRefreshEvent = () => {
    if (currentEventId) fetchEvent(currentEventId);
  };

  const loginViaMagicTokenInUrl = async (magicToken: string) => {
    const response = await verifyMagicLink(magicToken);
    if (response && response.success) {
      handleMagicLinkSuccess();
    }

    window.history.pushState({}, "", "/");
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

      const newsletterMatch = window.location.pathname.match(/^\/newsletter\/(\d+)$/);
      const isKaloramaRoute =
        window.location.pathname.startsWith("/kal");
      const isParkletRoute =
        window.location.pathname.startsWith("/parklet");
      const is2b04Route =
        window.location.pathname.startsWith("/2b04");
      const isRatsRoute =
        window.location.pathname.startsWith("/rats");
      const isDogsRoute =
        window.location.pathname.startsWith("/dogs");
      const hardcodedFlyerMatch = window.location.pathname.match(
        /^\/(shirt|sign|card)-(agree|disagree)/,
      );

      const roomIdFromUrl = parseRoomIdFromUrl();
      const subHeardFromUrl = parseSubHeardFromUrl();
      const analysisRoomIdFromUrl =
        parseAnalysisRoomIdFromUrl();
      const flyerDataFromUrl = parseFlyerDataFromUrl();
      const eventIdFromUrl = parseEventIdFromUrl();

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
      } else if (isKaloramaRoute) {
        setPendingFlyerScan("kalorama");
        setPendingCommunities(KALORAMA_COMMUNITIES);
        startRoomJoin(KALORAMA_ROOM_ID);
      } else if (
        isParkletRoute ||
        is2b04Route ||
        isRatsRoute ||
        isDogsRoute
      ) {
        const hardcodedRoomId = isParkletRoute
          ? "aocxafg7tnpmmv7j6sh"
          : is2b04Route
            ? "5zagvhpy4iamnf18dh5"
            : isRatsRoute
              ? "rrrir5rzsi9moacjd80"
              : isDogsRoute
                ? "jl4rwa5amtmolpfau4"
                : undefined;

        const routeName = isParkletRoute
          ? "parklet"
          : is2b04Route
            ? "2b04"
            : isRatsRoute
              ? "rats"
              : "dogs";

        if (!hardcodedRoomId) {
          toast.error("Invalid route");
        } else {
          setPendingFlyerScan(routeName);
          setPendingCommunities(KALORAMA_COMMUNITIES);
          startRoomJoin(hardcodedRoomId);
        }
      } else if (hardcodedFlyerMatch) {
        const [, routeKey, voteWord] = hardcodedFlyerMatch;
        const flyerConfig = HARDCODED_FLYER_ROUTES[routeKey];
        handleFlyerJoin({
          flyerId: flyerConfig.flyerId,
          statementId: flyerConfig.statementId,
          vote: voteWord === "agree" ? "agree" : "disagree",
        });
      } else if (flyerDataFromUrl) {
        handleFlyerJoin(flyerDataFromUrl);
      } else if (eventIdFromUrl) {
        setCurrentEventId(eventIdFromUrl);
      } else if (roomIdFromUrl) {
        startRoomJoin(roomIdFromUrl);
      } else if (subHeardFromUrl) {
        setCurrentSubHeard(subHeardFromUrl);
      } else if (isTermsRoute) {
        setShowTerms(true);
      } else if (isPrivacyRoute) {
        setShowPrivacy(true);
      } else if (isOrgsRoute) {
        setShowOrgsPage(true);
      } else if (newsletterMatch) {
        const edition = parseInt(newsletterMatch[1]);
        setNewsletterEdition(edition);
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
      !newsletterEdition &&
      !isJoiningAnonymously
    ) {
      (async () => {
        setIsJoiningAnonymously(true);
        await createAnonymousUser();
        setIsJoiningAnonymously(false);
      })();
    }
  }, [
    user,
    hasCheckedUrl,
    showUnsubscribe,
    showAdminPanel,
    showDevTools,
    newsletterEdition,
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
    (async () => {
      if (user && targetRoomId) {
        const roomData = await joinRoom(targetRoomId);
        if (roomData) {
          if (roomData.subHeard) {
            await joinSubHeard(roomData.subHeard);
          }
        } else {
          setTargetRoomId(null);
          clearRoomFromUrl();
        }
        setIsJoiningAnonymously(false);
        setIsJoiningRoom(false);
      }
    })();
  }, [user, targetRoomId, joinRoom]);

  useEffect(() => {
    if (user && hasCheckedUrl && pendingCommunities.length > 0) {
      if (pendingFlyerScan) {
        api.recordFlyerScan(pendingFlyerScan);
        setPendingFlyerScan(null);
      }
      Promise.all(pendingCommunities.map((community) => api.joinSubHeard(community)));
      setPendingCommunities([]);
    }
  }, [user, hasCheckedUrl, pendingCommunities, pendingFlyerScan]);

  useEffect(() => {
    if (user && hasCheckedUrl && !isJoiningRoom) {
      getActiveRooms();
    }
  }, [user?.id, currentSubHeard, getActiveRooms, hasCheckedUrl, isJoiningRoom]);

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

  if (newsletterEdition) {
    return <NewsletterViewer edition={newsletterEdition} />;
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
        roomsLoading={roomsLoading}
        error={error}
        currentSubHeard={currentSubHeard || undefined}
        roomStatements={roomStatements}
        targetRoomId={targetRoomId || undefined}
        analysisRoomId={analysisRoomId || undefined}
        hasQrScanResult={!!qrScanResult}
        eventLoading={eventLoading}
        currentEvent={currentEvent}
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
        onOpenEvent={handleOpenEvent}
        onRefreshEvent={handleRefreshEvent}
        onExitEvent={handleExitEvent}
      />
      <Toaster />
      {qrScanResult && (
        <QRScanResultDialog
          room={qrScanResult.room}
          agreePercent={qrScanResult.agreePercent}
          disagreePercent={qrScanResult.disagreePercent}
          passPercent={qrScanResult.passPercent}
          userVote={qrScanResult.userVote}
          statementText={qrScanResult.statementText}
          teaserStatement={qrScanResult.teaserStatement}
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