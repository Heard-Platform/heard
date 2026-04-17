import type {
  UserSession,
  DebateRoom, NewDebateRoom,
  VoteType,
  UserPresence, SubHeard,
  EventSummary,
  Event,
} from "../types";
import { EventPage } from "../components/events/EventPage";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  RoomScroller,
  RoomScrollerRef,
} from "../components/RoomScroller";
import { CreateRoomSheet } from "../components/CreateRoomSheet";
import { CreateEventSheet } from "../components/CreateEventSheet";
import { SubHeardBrowser } from "../components/community/SubHeardBrowser";
import { CommunityExplorerDialog } from "../components/community/CommunityExplorerDialog";
import { IntroModal } from "../components/IntroModal";
import { KeyboardDebugPanel } from "../components/KeyboardDebugPanel";
import { NewItemButton } from "../components/NewItemButton";
import { SidePanelMenu } from "../components/SidePanelMenu";
import { AnonAccountSetupModal } from "../components/AnonAccountSetupModal";
import { api, safelyMakeApiCall } from "../utils/api";
import { FeatureFlags, isFeatureEnabled } from "../utils/constants/feature-flags";
import { formatSubHeardDisplay } from "../utils/subheard";

interface LobbyScreenProps {
  user: UserSession;
  activeRooms: DebateRoom[];
  roomsLoading: boolean;
  error: string | null;
  currentSubHeard?: string;
  roomStatements: Record<string, any[]>;
  targetRoomId?: string;
  analysisRoomId?: string;
  hasQrScanResult?: boolean;
  eventLoading?: boolean;
  currentEvent?: Event | null;
  onCreateRoom: (
    newDebate: NewDebateRoom,
  ) => Promise<DebateRoom>;
  onJoinRoom: (roomId: string) => Promise<void>;
  onRefreshRooms: (subHeard?: string) => Promise<DebateRoom[]>;
  onJumpToFinalResults?: () => Promise<void>;
  onSubmitStatement: (
    roomId: string,
    text: string,
  ) => Promise<any>;
  onVoteOnStatement: (
    statementId: string,
    voteType: VoteType,
  ) => Promise<any>;
  onLogout?: () => void;
  onOpenShowcase?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenFeatureTracker: () => void;
  onOpenDevTools?: () => void;
  onSubHeardChange?: (subHeard: string | null) => void;
  onOpenEvent: (eventId: string) => void;
  onExitEvent: () => void;
}

export function LobbyScreen({
  user,
  activeRooms,
  roomsLoading,
  error,
  hasQrScanResult,
  currentSubHeard,
  eventLoading,
  currentEvent,
  onCreateRoom,
  onJoinRoom,
  onRefreshRooms,
  onJumpToFinalResults,
  onSubmitStatement,
  onVoteOnStatement,
  onLogout,
  onOpenShowcase,
  onOpenAdminPanel,
  onOpenAdminDashboard,
  onOpenFeatureTracker,
  onOpenDevTools,
  onSubHeardChange,
  onOpenEvent,
  onExitEvent,
  roomStatements,
  targetRoomId,
  analysisRoomId,
}: LobbyScreenProps) {
  const [createRoomSheetOpen, setCreateRoomSheetOpen] =
    useState(false);
  const [createEventSheetOpen, setCreateEventSheetOpen] =
    useState(false);

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
  const [explorerOpen, setExplorerOpen] = useState(false);
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

  const handleJoinRoom = async (roomId: string) => {
    await onJoinRoom(roomId);
  };

  const handleOpenCreateSheet = () => {
    if (user.isAnonymous) {
      setShowAccountSetupAnonModal(true);
      setAccountSetupFeatureText("make a post");
    } else {
      setDiscussTopic(undefined);
      setDiscussSubHeard(undefined);
      setCreateRoomSheetOpen(true);
    }
  };

  const handleOpenCreateEventSheet = () => {
    setCreateEventSheetOpen(true);
  };

  const handleDiscussStatement = (
    statementText: string,
    subHeard?: string,
  ) => {
    setDiscussTopic(statementText);
    setDiscussSubHeard(subHeard);
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

  const handleShowAccountSetupModal = (featureText: string) => {
    setAccountSetupFeatureText(featureText);
    setShowAccountSetupAnonModal(true);
  };

  const handleExplorerCommunitiesJoined = () => {
    onRefreshRooms(currentSubHeard);
    setExplorerOpen(false);
  };

  const handleCloseExplorer = () => {
    setExplorerOpen(false);
  };

  return (
    <>
      <IntroModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      {/* Event page view — header in normal flow so it pushes content down */}
      {(eventLoading || currentEvent) && (
        <div className="flex flex-col h-screen heard-page-bg">
          <div className="controls-layer pt-[6px] px-2 flex justify-center items-center shrink-0">
            <div
              className="flex items-center w-full max-w-2xl"
              style={{ marginTop: 8, marginBottom: 8 }}
            >
              <button
                onClick={onExitEvent}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Back to{" "}
                  {formatSubHeardDisplay(
                    currentEvent?.communityName ?? "feed",
                  )}
                </span>
              </button>
            </div>
          </div>
          {currentEvent ? (
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <EventPage
                event={currentEvent}
                onAddRoom={() => {}}
                onOpenRoom={() => {}}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
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
          )}
        </div>
      )}

      {/* Feed view — absolute floating header over snap-scroll */}
      {!currentEvent && !eventLoading && (
        <div className="relative">
          {/* Floating header with user info and menu */}
          <div className="absolute top-0 left-0 right-0 controls-layer pt-[6px] px-2 flex justify-center items-center">
            <div
              className="flex items-center justify-between gap-2 w-full max-w-2xl"
              style={{ marginTop: 8 }}
            >
              {onSubHeardChange && (
                <div className="flex-1 min-w-0 mr-3">
                  <SubHeardBrowser
                    currentSubHeard={currentSubHeard}
                    user={user}
                    onSubHeardChange={onSubHeardChange}
                    onUpdateSubHeard={async (community: SubHeard) => {
                      try {
                        const response =
                          await api.updateSubHeardSettings(community);
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
                    onLogoClick={() => {
                      roomScrollerRef.current?.scrollToTop();
                      if (user.isDeveloper) {
                        setShowDebugPanel(!showDebugPanel);
                      }
                    }}
                  />
                </div>
              )}

              <NewItemButton
                onNewConversation={handleOpenCreateSheet}
                onNewEvent={handleOpenCreateEventSheet}
              />

              {onLogout && (
                <SidePanelMenu
                  user={user}
                  onLogout={onLogout}
                  onOpenHelp={() => setHelpModalOpen(true)}
                  onOpenShowcase={onOpenShowcase}
                  onOpenAdminDashboard={onOpenAdminDashboard}
                  onOpenFeatureTracker={onOpenFeatureTracker}
                  onOpenDevTools={onOpenDevTools}
                  onOpenAdminPanel={onOpenAdminPanel}
                  onJumpToFinalResults={onJumpToFinalResults}
                  onCreateAnonDebate={handleCreateAnonDebate}
                  onShowAccountSetupModal={
                    handleShowAccountSetupModal
                  }
                />
              )}
            </div>
          </div>

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
            presences={presences}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleOpenCreateSheet}
            onSubmitStatement={onSubmitStatement}
            onVoteOnStatement={onVoteOnStatement}
            onDiscussStatement={handleDiscussStatement}
            onUpdatePresence={handleUpdatePresence}
            onShowAccountSetupModal={handleShowAccountSetupModal}
            onOpenExplorer={() => setExplorerOpen(true)}
            onOpenEvent={onOpenEvent}
          />
        </div>
      )}

      {/* Create room sheet */}
      <CreateRoomSheet
        open={createRoomSheetOpen}
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

      {/* Create event sheet */}
      <CreateEventSheet
        open={createEventSheetOpen}
        userId={user.id}
        defaultSubHeard={currentSubHeard}
        onOpenChange={setCreateEventSheetOpen}
        onGoToEvent={() => setCreateEventSheetOpen(false)}
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
    </>
  );
}