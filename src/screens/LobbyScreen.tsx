import type {
  UserSession,
  DebateRoom, NewDebateRoom,
  Statement,
  VoteType,
  UserPresence, SubHeard,
  EventSummary,
  Event,
} from "../types";
import { EventView } from "../components/events/EventView";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  RoomScroller,
  RoomScrollerRef,
} from "../components/RoomScroller";
import { CreateRoomSheet } from "../components/CreateRoomSheet";
import { SubHeardBrowser } from "../components/community/SubHeardBrowser";
import { CommunityExplorerDialog } from "../components/community/CommunityExplorerDialog";
import { IntroModal } from "../components/IntroModal";
import { KeyboardDebugPanel } from "../components/KeyboardDebugPanel";
import { FundingTeaser } from "../components/FundingTeaser";
import { SidePanelMenu } from "../components/SidePanelMenu";
import { AnonAccountSetupModal } from "../components/AnonAccountSetupModal";
import { BottomNav, type BottomNavTab } from "../components/BottomNav";
import { FeedHeader, FEED_HEADER_HEIGHT_PX } from "../components/FeedHeader";
import { useHideOnScroll } from "../hooks/useHideOnScroll";
import { api, safelyMakeApiCall } from "../utils/api";
import { FeatureFlags, isFeatureEnabled } from "../utils/constants/feature-flags";
import { RoomAlertsProvider } from "../contexts/RoomAlertsContext";


interface LobbyScreenProps {
  user: UserSession;
  activeRooms: DebateRoom[];
  roomsLoading: boolean;
  error: string | null;
  currentSubHeard?: string;
  roomStatements: Record<string, any[]>;
  targetRoomId?: string;
  analysisRoomId?: string;
  targetStatementId?: string;
  eventLoading?: boolean;
  currentEvent?: Event | null;
  onCreateRoom: (
    newDebate: NewDebateRoom,
  ) => Promise<DebateRoom>;
  onJumpToRoom: (roomId: string, subHeard?: string) => void;
  onRefreshRooms: (subHeard?: string) => Promise<DebateRoom[]>;
  onJumpToFinalResults?: () => Promise<void>;
  onSubmitStatement: (
    roomId: string,
    text: string,
  ) => Promise<any>;
  onVoteOnStatement: (
    statement: Statement,
    voteType: VoteType,
  ) => Promise<any>;
  onLogout?: () => void;
  onOpenShowcase?: () => void;
  onOpenActivityDashboard: () => void;
  onOpenRetentionDashboard: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenFeatureTracker: () => void;
  onOpenDevTools?: () => void;
  onOpenActivityFeed: () => void;
  onSubHeardChange: (subHeard: string | null) => void;
  onOpenEvent: (eventId: string) => void;
  onRefreshEvent: () => void;
  onExitEvent: () => void;
}

export function LobbyScreen({
  user,
  activeRooms,
  roomsLoading,
  error,
  currentSubHeard,
  eventLoading,
  currentEvent,
  onCreateRoom,
  onJumpToRoom,
  onRefreshRooms,
  onJumpToFinalResults,
  onSubmitStatement,
  onVoteOnStatement,
  onLogout,
  onOpenShowcase,
  onOpenActivityDashboard,
  onOpenRetentionDashboard,
  onOpenAdminPanel,
  onOpenAdminDashboard,
  onOpenFeatureTracker,
  onOpenDevTools,
  onOpenActivityFeed,
  onSubHeardChange,
  onOpenEvent,
  onRefreshEvent,
  onExitEvent,
  roomStatements,
  targetRoomId,
  analysisRoomId,
  targetStatementId,
}: LobbyScreenProps) {
  const [createRoomSheetOpen, setCreateRoomSheetOpen] =
    useState(false);
  const [startInRantMode, setStartInRantMode] = useState(false);

  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [discussTopic, setDiscussTopic] = useState<
    string | undefined
  >(undefined);
  const [discussSubHeard, setDiscussSubHeard] = useState<
    string | undefined
  >(undefined);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [debugViewport, setDebugViewport] = useState({
    viewportHeight: 0,
    windowHeight: 0,
    ratio: 0,
  });
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const roomScrollerRef = useRef<RoomScrollerRef>(null);
  const initialWindowHeightRef = useRef<number>(0);
  const [presences, setPresences] = useState<UserPresence[]>(
    [],
  );
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [showAccountSetupAnonModal, setShowAccountSetupAnonModal] = useState(false);
  const [accountSetupFeatureText, setAccountSetupFeatureText] = useState("");
  const [accountSetupIsSignIn, setAccountSetupIsSignIn] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { hidden: headerHidden, handleScroll: handleFeedScroll } =
    useHideOnScroll(FEED_HEADER_HEIGHT_PX);
  type Steps = "tutorial" | "explorer" | "complete";

  const filteredRooms = useMemo(() => {
    return [...activeRooms].sort((a, b) => {
      if (targetRoomId) {
        if (a.id === targetRoomId) return -1;
        if (b.id === targetRoomId) return 1;
      }
      return 0;
    });
  }, [activeRooms, targetRoomId]);


  // Detect mobile keyboard state
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.visualViewport
    ) {
      console.log("🚫 Visual Viewport API not available");
      return;
    }

    // Capture the initial window height ONCE on mount (before any keyboard interactions)
    if (initialWindowHeightRef.current === 0) {
      initialWindowHeightRef.current = window.innerHeight;
    }

    const handleResize = () => {
      const viewportHeight = window.visualViewport!.height;
      const currentWindowHeight = window.innerHeight;
      const initialWindowHeight =
        initialWindowHeightRef.current;

      // Use the INITIAL window height for ratio calculation, not the current one
      const ratio = viewportHeight / initialWindowHeight;

      // Keyboard open = viewport shrinks significantly
      const keyboardOpen = ratio < 0.75;

      setIsKeyboardOpen(keyboardOpen);
      setDebugViewport({
        viewportHeight,
        windowHeight: currentWindowHeight,
        ratio,
      });
    };

    // Check initial state
    handleResize();

    window.visualViewport.addEventListener(
      "resize",
      handleResize,
    );
    window.visualViewport.addEventListener(
      "scroll",
      handleResize,
    );

    return () => {
      window.visualViewport!.removeEventListener(
        "resize",
        handleResize,
      );
      window.visualViewport!.removeEventListener(
        "scroll",
        handleResize,
      );
    };
  }, []);

  // Fetch events for the current community (feature-flagged)
  useEffect(() => {
    if (!isFeatureEnabled(FeatureFlags.EVENTS)) return;
    const fetchEvents = async () => {
      const response = await safelyMakeApiCall(() =>
        api.getEvents(currentSubHeard),
      );
      if (response?.data) {
        setEvents(response.data.events);
      }
    };
    fetchEvents();
  }, [currentSubHeard]);

  // Poll for user presences
  useEffect(() => {
    const fetchPresences = async () => {
      const response = await api.getActivePresences();
      if (response.success && response.data) {
        const presenceData =
          response.data.data || response.data;
        if (Array.isArray(presenceData)) {
          setPresences(presenceData);
        }
      }
    };

    fetchPresences();
    const pollInterval = setInterval(fetchPresences, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleUpdatePresence = async (
    currentRoomIndex: number,
  ) => {
    await api.updateUserPresence(currentRoomIndex);
  };

  const handleCreateAnonDebate = async () => {
    try {
      const response = await api.createAnonDebate();
      if (response.success && response.data) {
        await onRefreshRooms();
        alert(
          `✅ Room created!\n\nShare this invite link:\n${response.data.invitePath}\n\nAnyone with this link can join anonymously!`,
        );
      }
    } catch (error) {
      console.error("Error creating anon post:", error);
      alert("Failed to create anon-enabled post");
    }
  };

  const openCreateSheet = () => {
    if (user.isAnonymous) {
      setShowAccountSetupAnonModal(true);
      setAccountSetupFeatureText("make a post");
    } else {
      setDiscussTopic(undefined);
      setDiscussSubHeard(undefined);
      setCreateRoomSheetOpen(true);
    }
  };

  const handleOpenCreateSheetComposing = () => {
    setStartInRantMode(false);
    openCreateSheet();
  }

  const handleOpenCreateSheetRanting = () => {
    setStartInRantMode(true);
    openCreateSheet();
  }

  const handleDiscussStatement = (
    statementText: string,
    subHeard?: string,
  ) => {
    setDiscussTopic(statementText);
    setDiscussSubHeard(subHeard);
    setStartInRantMode(false);
    setCreateRoomSheetOpen(true);
  };

  const handleCreateRoomSheetChange = (open: boolean) => {
    setCreateRoomSheetOpen(open);
    if (!open) {
      // Clear the discuss topic and subheard when the sheet closes
      setDiscussTopic(undefined);
      setDiscussSubHeard(undefined);
    }
  };

  const handleCreateRoom = async (
    newDebate: NewDebateRoom,
  ): Promise<DebateRoom> => {
    const result = await onCreateRoom(newDebate);
    
    setTimeout(() => {
      roomScrollerRef.current?.scrollToTop();
    }, 300);

    return result;
  };

  const handleShowAccountSetupModal = (featureText: string, isSignIn?: boolean) => {
    setAccountSetupFeatureText(featureText);
    setAccountSetupIsSignIn(!!isSignIn);
    setShowAccountSetupAnonModal(true);
  };

  const handleExplorerCommunitiesJoined = (joinedCommunityNames: string[]) => {
    setExplorerOpen(false);
    onSubHeardChange(
      joinedCommunityNames.length === 1
        ? joinedCommunityNames[0]
        : null,
    );
  };

  const handleCloseExplorer = () => {
    setExplorerOpen(false);
  };

  const handleWordmarkClick = () => {
    roomScrollerRef.current?.scrollToTop();
    if (user.isDeveloper) {
      setShowDebugPanel(!showDebugPanel);
    }
  };

  const handleSelectBottomNavTab = (tab: BottomNavTab) => {
    api.trackEvent(`bottom_nav_${tab}_tapped`);
    switch (tab) {
      case "home":
        roomScrollerRef.current?.scrollToTop();
        break;
      case "explore":
        setExplorerOpen(true);
        break;
      case "new":
        handleOpenCreateSheetRanting();
        break;
      case "profile":
        if (user.isAnonymous) {
          handleShowAccountSetupModal("sign in or create an account", true);
        } else {
          setProfileMenuOpen(true);
        }
        break;
    }
  };

  return (
    <RoomAlertsProvider>
      <IntroModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      {/* Event view */}
      {(eventLoading || currentEvent) && (
        <EventView
          event={currentEvent ?? null}
          eventLoading={eventLoading}
          user={user}
          currentSubHeard={currentSubHeard}
          onExitEvent={onExitEvent}
          onSubmitStatement={onSubmitStatement}
          onVoteOnStatement={onVoteOnStatement}
          onShowAccountSetupModal={handleShowAccountSetupModal}
          onCreateRoom={onCreateRoom}
          onRefreshEvent={onRefreshEvent}
          onSubHeardChange={onSubHeardChange}
        />
      )}

      {/* Feed view — absolute floating header over snap-scroll */}
      {!currentEvent && !eventLoading && (
        <div className="heard-feed-bg">
          <div className="relative w-full">
            <FeedHeader
              hidden={headerHidden}
              communityPicker={
                <SubHeardBrowser
                  currentSubHeard={currentSubHeard}
                  user={user}
                  onSubHeardChange={onSubHeardChange}
                  onUpdateSubHeard={async (
                    community: SubHeard,
                  ) => {
                    try {
                      const response =
                        await api.updateSubHeardSettings(
                          community,
                        );
                      if (response.success) {
                        return true;
                      }
                      console.error(
                        "Failed to update sub-heard:",
                        response.error,
                      );
                      return false;
                    } catch (error) {
                      console.error(
                        "Error updating sub-heard:",
                        error,
                      );
                      return false;
                    }
                  }}
                  onShowAccountSetupModal={
                    handleShowAccountSetupModal
                  }
                  onOpenExplorer={() => setExplorerOpen(true)}
                />
              }
              onWordmarkClick={handleWordmarkClick}
            />

            <RoomScroller
              ref={roomScrollerRef}
              rooms={filteredRooms}
              events={events}
              isDeveloper={user.isDeveloper || false}
              loading={roomsLoading}
              user={user}
              currentSubHeard={currentSubHeard}
              roomStatements={roomStatements}
              analysisRoomId={analysisRoomId}
              targetStatementId={targetStatementId}
              presences={presences}
              onCreateRoom={handleOpenCreateSheetComposing}
              onSubmitStatement={onSubmitStatement}
              onVoteOnStatement={onVoteOnStatement}
              onDiscussStatement={handleDiscussStatement}
              onUpdatePresence={handleUpdatePresence}
              onShowAccountSetupModal={handleShowAccountSetupModal}
              onOpenExplorer={() => setExplorerOpen(true)}
              onOpenEvent={onOpenEvent}
              onSubHeardChange={onSubHeardChange}
              onScrollTopChange={handleFeedScroll}
            />
          </div>
        </div>
      )}

      {!currentEvent && !eventLoading && <FundingTeaser />}

      {!currentEvent && !eventLoading && !isKeyboardOpen && (
        <BottomNav
          user={user}
          onSelectTab={handleSelectBottomNavTab}
        />
      )}

      {onLogout && (
        <SidePanelMenu
          user={user}
          open={profileMenuOpen}
          onOpenChange={setProfileMenuOpen}
          onLogout={onLogout}
          onOpenHelp={() => setHelpModalOpen(true)}
          onOpenShowcase={onOpenShowcase}
          onOpenActivityDashboard={onOpenActivityDashboard}
          onOpenRetentionDashboard={onOpenRetentionDashboard}
          onOpenAdminDashboard={onOpenAdminDashboard}
          onOpenFeatureTracker={onOpenFeatureTracker}
          onOpenDevTools={onOpenDevTools}
          onOpenActivityFeed={onOpenActivityFeed}
          onOpenAdminPanel={onOpenAdminPanel}
          onJumpToFinalResults={onJumpToFinalResults}
          onCreateAnonDebate={handleCreateAnonDebate}
          onShowAccountSetupModal={handleShowAccountSetupModal}
          onJumpToRoom={onJumpToRoom}
        />
      )}

      {/* Create room sheet */}
      <CreateRoomSheet
        open={createRoomSheetOpen}
        startInRantMode={startInRantMode}
        userId={user.id}
        onOpenChange={handleCreateRoomSheetChange}
        onCreateRoom={handleCreateRoom}
        onExtractTopicAndStatements={async (rant) => {
          const response = await api.extractTopicAndStatements(rant);
          if (!response.success || !response.data) {
            throw new Error(
              response.error ||
                "Failed to extract topic and statements",
            );
          }
          return response.data;
        }}
        defaultSubHeard={discussSubHeard || currentSubHeard}
        defaultTopic={discussTopic}
      />

      {/* Error notification */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Developer viewport debug panel */}
      {user.isDeveloper && (
        <KeyboardDebugPanel
          show={showDebugPanel}
          isKeyboardOpen={isKeyboardOpen}
          viewportHeight={debugViewport.viewportHeight}
          windowHeight={debugViewport.windowHeight}
          ratio={debugViewport.ratio}
          initialWindowHeight={initialWindowHeightRef.current}
        />
      )}

      {/* Account Setup Modal */}
      <AnonAccountSetupModal
        featureText={accountSetupFeatureText}
        isSignIn={accountSetupIsSignIn}
        isOpen={showAccountSetupAnonModal}
        onClose={() => setShowAccountSetupAnonModal(false)}
      />

      {/* Community Explorer Dialog */}
      <CommunityExplorerDialog
        isOpen={explorerOpen}
        userId={user.id}
        cancelButtonText={"Close"}
        onCommunitiesJoined={handleExplorerCommunitiesJoined}
        onClose={handleCloseExplorer}
      />
    </RoomAlertsProvider>
  );
}