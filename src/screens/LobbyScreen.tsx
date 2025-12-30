import type {
  UserSession,
  DebateRoom, NewDebateRoom,
  VoteType,
  UserPresence
} from "../types";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import {
  RoomScroller,
  RoomScrollerRef,
} from "../components/RoomScroller";
import { CreateRoomSheet } from "../components/CreateRoomSheet";
import { SubHeardBrowser } from "../components/SubHeardBrowser";
import { IntroModal } from "../components/IntroModal";
import { FloatingCreateButton } from "../components/FloatingCreateButton";
import { FloatingFeedbackButton } from "../components/FloatingFeedbackButton";
import { KeyboardDebugPanel } from "../components/KeyboardDebugPanel";
import { SidePanelMenu } from "../components/SidePanelMenu";
import { AnonAccountSetupModal } from "../components/AnonAccountSetupModal";
import { api } from "../utils/api";

interface LobbyScreenProps {
  user: UserSession;
  activeRooms: DebateRoom[];
  loading: boolean;
  error: string | null;
  currentSubHeard?: string;
  roomStatements: Record<string, any[]>;
  targetRoomId?: string;
  analysisRoomId?: string;
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
  onOpenDevTools?: () => void;
  onSubHeardChange?: (subHeard: string | null) => void;
  onGetAllRoomStatements: () => Promise<Record<string, any[]>>;
}

export function LobbyScreen({
  user,
  activeRooms,
  loading,
  error,
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
  onOpenDevTools,
  currentSubHeard,
  onSubHeardChange,
  roomStatements,
  onGetAllRoomStatements,
  targetRoomId,
  analysisRoomId,
}: LobbyScreenProps) {
  const [createRoomSheetOpen, setCreateRoomSheetOpen] =
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
  const [showAccountSetupAnonModal, setShowAccountSetupAnonModal] = useState(false);
  const [accountSetupFeatureText, setAccountSetupFeatureText] = useState("");

  // Sort rooms: target room first, then newest first
  const filteredRooms = activeRooms.sort((a, b) => {
    // If there's a target room ID, put it first
    if (targetRoomId) {
      if (a.id === targetRoomId) return -1;
      if (b.id === targetRoomId) return 1;
    }
    // Otherwise sort by newest first
    return b.createdAt - a.createdAt;
  });

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      setHelpModalOpen(true);
      localStorage.setItem("hasSeenIntro", "true");
    }
  }, []);

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
      console.log(
        "📏 Initial window height captured:",
        initialWindowHeightRef.current,
      );
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

      console.log("📱 Viewport change:", {
        viewportHeight,
        currentWindowHeight,
        initialWindowHeight,
        ratio: ratio.toFixed(2),
        keyboardOpen,
        threshold: 0.75,
      });

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

  // Debug: log when keyboard state changes
  useEffect(() => {
    console.log(
      "⌨️ Keyboard state changed:",
      isKeyboardOpen ? "OPEN" : "CLOSED",
    );
  }, [isKeyboardOpen]);

  // Refresh rooms on mount and when sub-heard changes
  useEffect(() => {
    onRefreshRooms(currentSubHeard);
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
    const pollInterval = setInterval(fetchPresences, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleUpdatePresence = async (
    userId: string,
    currentRoomIndex: number,
  ) => {
    await api.updateUserPresence(userId, currentRoomIndex);
  };

  const handleCreateAnonDebate = async () => {
    try {
      const response = await api.createAnonDebate(user.id);
      if (response.success && response.data) {
        await onRefreshRooms();
        alert(
          `✅ Room created!\n\nShare this invite link:\n${response.data.invitePath}\n\nAnyone with this link can join anonymously!`,
        );
      }
    } catch (error) {
      console.error("Error creating anon debate:", error);
      alert("Failed to create anon-enabled debate");
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    await onJoinRoom(roomId);
  };

  const handleOpenCreateSheet = () => {
    if (user.isAnonymous) {
      setShowAccountSetupAnonModal(true);
      setAccountSetupFeatureText("creating debates");
    } else {
      setDiscussTopic(undefined);
      setDiscussSubHeard(undefined);
      setCreateRoomSheetOpen(true);
    }
  };

  const handleSetupAnonAccount = async (nickname: string, email: string, password: string) => {
    const response = await api.setupAnonymousUser(user.id, nickname, email, password);
    if (response.success && response.data) {
      window.location.reload();
    } else {
      throw new Error(response.error || "Failed to setup account");
    }
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

  return (
    <>
      {/* Intro Modal - controlled externally */}
      <IntroModal
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
      />

      {/* Main TikTok-style scroller */}
      <div className="relative">
        {/* Floating header with user info and menu */}
        <div className="absolute top-0 left-0 right-0 controls-layer p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className="flex flex-col"
              onClick={() => {
                if (user.isDeveloper) {
                  setShowDebugPanel(!showDebugPanel);
                }
              }}
              style={{
                cursor: user.isDeveloper
                  ? "pointer"
                  : "default",
              }}
            >
              <p className="text-[10px] text-purple-400/80 tracking-wide uppercase mb-[-2px]">
                A place to be
              </p>
              <motion.h1
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg"
                style={{
                  WebkitTextStroke:
                    "0.6px rgba(255,255,255,0.8)",
                }}
              >
                HEARD
              </motion.h1>
            </div>
          </div>

          {/* Sub-Heard Browser and User menu */}
          <div className="flex items-center gap-2">
            {onSubHeardChange && (
              <SubHeardBrowser
                currentSubHeard={currentSubHeard}
                user={user}
                onSubHeardChange={onSubHeardChange}
                onCreateSubHeard={async (
                  name: string,
                  userId: string,
                  isPrivate?: boolean,
                ) => {
                  try {
                    const response = await api.createSubHeard(
                      name,
                      userId,
                      isPrivate,
                    );
                    if (response.success) {
                      return true;
                    }
                    console.error(
                      "Failed to create sub-heard:",
                      response.error,
                    );
                    return false;
                  } catch (error) {
                    console.error(
                      "Error creating sub-heard:",
                      error,
                    );
                    return false;
                  }
                }}
                onUpdateSubHeard={async (
                  name: string,
                  userId: string,
                  isPrivate: boolean,
                ) => {
                  try {
                    const response =
                      await api.updateSubHeardSettings(
                        name,
                        userId,
                        isPrivate,
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
                onShowAccountSetupModal={handleShowAccountSetupModal}
              />
            )}

            {onLogout && (
              <SidePanelMenu
                user={user}
                onLogout={onLogout}
                onOpenHelp={() => setHelpModalOpen(true)}
                onOpenShowcase={onOpenShowcase}
                onOpenAdminDashboard={onOpenAdminDashboard}
                onOpenDevTools={onOpenDevTools}
                onOpenAdminPanel={onOpenAdminPanel}
                onJumpToFinalResults={onJumpToFinalResults}
                onCreateAnonDebate={handleCreateAnonDebate}
                onShowAccountSetupModal={handleShowAccountSetupModal}
              />
            )}
          </div>
        </div>

        {/* Room scroller */}
        <RoomScroller
          ref={roomScrollerRef}
          rooms={filteredRooms}
          isDeveloper={user.isDeveloper || false}
          loading={loading}
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
          onGetAllRoomStatements={onGetAllRoomStatements}
          onUpdatePresence={handleUpdatePresence}
          onShowAccountSetupModal={handleShowAccountSetupModal}
        />
      </div>

      {/* Floating create button - hide when keyboard is open */}
      {!isKeyboardOpen && (
        <FloatingCreateButton
          onPress={handleOpenCreateSheet}
        />
      )}

      {/* Floating feedback button - hide when keyboard is open */}
      {!isKeyboardOpen && (
        <FloatingFeedbackButton userId={user.id} />
      )}

      {/* Create room sheet */}
      <CreateRoomSheet
        open={createRoomSheetOpen}
        userId={user.id}
        onOpenChange={handleCreateRoomSheetChange}
        onCreateRoom={handleCreateRoom}
        onExtractTopicAndStatements={async (rant) => {
          const response =
            await api.extractTopicAndStatements(rant);
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
        isOpen={showAccountSetupAnonModal}
        onSetupAnon={handleSetupAnonAccount}
        onClose={() => setShowAccountSetupAnonModal(false)}
      />
    </>
  );
}