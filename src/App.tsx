import { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { motion } from "motion/react";
import { UnsubscribePage } from "./components/UnsubscribePage";
import { TermsOfServicePage } from "./screens/TermsOfServicePage";
import { PrivacyPolicyPage } from "./screens/PrivacyPolicyPage";
import { OrgsLanding } from "./screens/OrgsLanding";
import { OneBillionPage } from "./screens/OneBillionPage";
import { FundingPage } from "./screens/funding/FundingPage";
import { AiUsagePage } from "./screens/AiUsagePage";
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
  parseStatementIdFromUrl,
} from "./utils/url";
import { QRScanResult, QRScanResultDialog } from "./components/room/QRScanResultDialog";
import { safelyGetStorageItem, safelySetStorageItem } from "./utils/localStorage";

const LAST_VIEWED_SUBHEARD_KEY = "lastViewedSubHeard";
const LAST_VIEWED_ROOM_KEY = "lastViewedRoom";

// @ts-ignore
import { toast } from "sonner@2.0.3";

const KALORAMA_COMMUNITIES = ["kalorama-park", "dupont-circle-neighborhoods", "washington-dc"];

const WAYMO_DUPONT_ROOM_ID = "jhxaoh1a3bmq2fflpx";
const WAYMO_DUPONT_STATEMENT_ID = "0d3m3yflnlc8mq2fflre";

const WAYMO_DC_ROOM_ID = "s6r23ralcomq8l9p6p";
const WAYMO_DC_STATEMENT_ID = "ecgld4qfclqmq8l9p82";

const I_LOVE_CIVTECH_FLYER_ID = "gv7kmooa0lmom3pn2m";
const I_LOVE_CIVTECH_STATEMENT_ID = "jg46pxp4fsmom3pn3c";

const CLUB_FLYER_ID = "i2yo40k84womp72i2qi";
const CLUB_STATEMENT_ID = "qkjea7qnj3mp72i2r3";

const HARDCODED_FLYER_ROUTES: Record<string, { flyerId: string; statementId: string }> = {
  shirt: { flyerId: WAYMO_DC_ROOM_ID, statementId: WAYMO_DC_STATEMENT_ID },
  sign: { flyerId: WAYMO_DC_ROOM_ID, statementId: WAYMO_DC_STATEMENT_ID },
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
  const [targetStatementId, setTargetStatementId] = useState<string | null>(null);
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
  const [showOneBillion, setShowOneBillion] = useState(false);
  const [showFundingPage, setShowFundingPage] = useState(false);
  const [showAiUsage, setShowAiUsage] = useState(false);
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

  const handleJumpToRoom = (roomId: string, subHeard?: string) => {
    setCurrentSubHeard(subHeard ?? null);
    startRoomJoin(roomId);
    updateUrlForRoom(roomId);
  };

  const handleSubHeardChange = (subHeard: string | null) => {
    setCurrentSubHeard(subHeard);
    setTargetRoomId(null);
    updateUrlForSubHeard(subHeard);
  };

  const handleQrComplete = ({ reason }: { reason: "signup" | "otp-login" | "continue" }) => {
    if (reason === "signup") toast.success("Welcome to Heard! 🎉");
    if (reason === "otp-login") toast.success("Welcome back! 🎉");
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

  useEffect(() => {
    if (user) {
      Sentry.setUser({ id: user.id });
    } else {
      Sentry.setUser(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (hasCheckedUrl) {
      safelySetStorageItem(LAST_VIEWED_SUBHEARD_KEY, currentSubHeard);
    }
  }, [currentSubHeard, hasCheckedUrl]);

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
      const { pathname } = window.location;
      const route = pathname.split("/")[1];
      const magicTokenFromUrl = urlParams.get("token");
      const isMagicLinkRoute = route === "magic-link";
      const isAdminRoute = route === "admin";
      const isDevToolsRoute = route === "devtools";
      const isUnsubscribeRoute = route === "unsubscribe";
      const isTermsRoute = route === "terms";
      const isPrivacyRoute = route === "privacy";
      const isOrgsRoute = route === "orgs";
      const isOneBillionRoute = route === "1billion";
      const isAiUsageRoute = route === "ai-usage";
      const isFundingRoute = route === "funding";
      const newsletterMatch = pathname.match(/^\/newsletter\/(\d+)$/);
      const isParkletRoute = route === "parklet";
      const is2b04Route = route === "2b04";
      const isRatsRoute = route === "rats";
      const isDogsRoute = route === "dogs";
      const isMarketRoute = route === "market";
      const is311Route = route === "311";
      const isDataRoute = route === "data";
      const isHeightRoute = route === "height";
      const isDcRoute = route === "dc";
      const isUdcRoute = route === "udc";
      const isWaymoRoute = route === "waymo";
      const isWaymoDcRoute = route === "waymodc";
      const hardcodedFlyerMatch = pathname.match(
        /^\/(shirt|sign|card)-(agree|disagree)/,
      );
      const clubFlyerMatch = pathname.match(/^\/club-(yes|no)/);
      const isClubRoute = /^\/club\/?$/.test(pathname);

      const roomIdFromUrl = parseRoomIdFromUrl();
      const subHeardFromUrl = parseSubHeardFromUrl();
      const analysisRoomIdFromUrl = parseAnalysisRoomIdFromUrl();
      const flyerDataFromUrl = parseFlyerDataFromUrl();
      const eventIdFromUrl = parseEventIdFromUrl();
      const statementIdFromUrl = parseStatementIdFromUrl();

      if (statementIdFromUrl) {
        setTargetStatementId(statementIdFromUrl);
      }

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
      } else if (
        isParkletRoute ||
        is2b04Route ||
        isRatsRoute ||
        isDogsRoute ||
        isMarketRoute ||
        is311Route ||
        isDataRoute ||
        isHeightRoute ||
        isUdcRoute ||
        isDcRoute ||
        isWaymoRoute ||
        isWaymoDcRoute
      ) {
        const hardcodedRoomId = isParkletRoute
          ? "aocxafg7tnpmmv7j6sh"
          : is2b04Route
            ? "5zagvhpy4iamnf18dh5"
            : isRatsRoute
              ? "rrrir5rzsi9moacjd80"
              : isDogsRoute
                ? "jl4rwa5amtmolpfau4"
                : isMarketRoute
                  ? "oltpupzrkkmp1ettwt"
                  : is311Route
                    ? "hn3nzbxfxe9mp2o2cjx"
                    : isDataRoute
                      ? "s7895siw8lqmp2zfkp8"
                      : isHeightRoute
                        ? "7y6ti3yj605mp2yni2i"
                        : isUdcRoute
                          ? "6vo32rv77imp2p51ti"
                          : isDcRoute
                            ? "0tlal5afi6mlmpbckaso"
                            : isWaymoRoute
                              ? WAYMO_DUPONT_ROOM_ID
                              : isWaymoDcRoute
                                ? WAYMO_DC_ROOM_ID
                                : null;

        const routeName = isParkletRoute
          ? "parklet"
          : is2b04Route
            ? "2b04"
            : isRatsRoute
              ? "rats"
              : isDogsRoute
                ? "dogs"
                : isMarketRoute
                  ? "market"
                  : is311Route
                    ? "311"
                    : isDataRoute
                      ? "data"
                      : isHeightRoute
                        ? "height"
                        : isUdcRoute
                          ? "udc"
                          : isWaymoRoute
                            ? "waymo"
                            : isWaymoDcRoute
                              ? "waymodc"
                              : "dc";

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
      } else if (clubFlyerMatch) {
        const [, voteWord] = clubFlyerMatch;
        handleFlyerJoin({
          flyerId: CLUB_FLYER_ID,
          statementId: CLUB_STATEMENT_ID,
          vote: voteWord === "yes" ? "agree" : "disagree",
        });
      } else if (isClubRoute) {
        startRoomJoin(CLUB_FLYER_ID);
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
      } else if (isOneBillionRoute) {
        setShowOneBillion(true);
      } else if (isAiUsageRoute) {
        setShowAiUsage(true);
      } else if (isFundingRoute) {
        setShowFundingPage(true);
      } else if (newsletterMatch) {
        const edition = parseInt(newsletterMatch[1]);
        setNewsletterEdition(edition);
      } else if (window.location.pathname === "/") {
        const lastSubHeard = safelyGetStorageItem<string | null>(
          LAST_VIEWED_SUBHEARD_KEY,
          null,
        );
        const lastRoomId = safelyGetStorageItem<string | null>(
          LAST_VIEWED_ROOM_KEY,
          null,
        );
        if (lastSubHeard) setCurrentSubHeard(lastSubHeard);
        if (lastRoomId) startRoomJoin(lastRoomId);
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
      !showAiUsage &&
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
    showAiUsage,
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
      getActiveRooms(targetRoomId || undefined);
    }
  }, [user?.id, currentSubHeard, getActiveRooms, hasCheckedUrl, isJoiningRoom, targetRoomId]);

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

  if (showOneBillion) {
    return <OneBillionPage />;
  }

  if (showFundingPage) {
    return (
      <>
        <FundingPage onExit={() => { setShowFundingPage(false); window.history.pushState({}, "", "/"); }} />
        <Toaster />
      </>
    );
  }

  if (showAiUsage) {
    return <AiUsagePage />;
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
        targetStatementId={targetStatementId || undefined}
        hasQrScanResult={!!qrScanResult}
        eventLoading={eventLoading}
        currentEvent={currentEvent}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onJumpToRoom={handleJumpToRoom}
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
          onComplete={handleQrComplete}
          onClose={() => handleQrComplete({ reason: "continue" })}
        />
      )}
    </>
  );
}

export default Sentry.withErrorBoundary(function App() {
  return (
    <DebateSessionProvider>
      <AppContent />
    </DebateSessionProvider>
  );
}, {
  fallback: (
    <div className="heard-page-bg heard-center">
      <div>Something went wrong. Please refresh the page.</div>
    </div>
  ),
});