import type {
  UserSession,
  DebateRoom,
  DebateMode,
  NewDebateRoom,
  VoteType,
} from "../types";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
import { api } from "../utils/api";
import {
  Plus,
  Database,
  LogOut,
  Brain,
  Code2,
  SkipForward,
  Clock,
  Shield,
  HelpCircle,
  BarChart3,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";

interface LobbyScreenProps {
  user: UserSession | null;
  activeRooms: DebateRoom[];
  loading: boolean;
  error: string | null;
  onCreateRoom: (
    newDebate: NewDebateRoom,
  ) => Promise<DebateRoom>;
  onJoinRoom: (roomId: string) => Promise<void>;
  onRefreshRooms: (subHeard?: string) => Promise<DebateRoom[]>;
  onJumpToFinalResults?: () => Promise<void>;
  onCreateSeedData?: () => Promise<any>;
  onCreateTestRoom?: () => Promise<any>;
  onCreateRantTestRoom?: () => Promise<any>;
  onCreateRealtimeTestRoom?: () => Promise<any>;
  onUpdateRoomDescription?: (
    description: string,
  ) => Promise<boolean>;
  onSetRoomInactive?: (roomId: string) => Promise<boolean>;
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
  currentSubHeard?: string;
  onSubHeardChange?: (subHeard: string | null) => void;
  roomStatements: Record<string, any[]>;
  onGetRoomStatements: (roomId: string) => Promise<any[]>;
  onGetAllRoomStatements: () => Promise<Record<string, any[]>>;
  targetRoomId?: string;
  onRoomCreated?: () => void;
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
  onCreateSeedData,
  onCreateTestRoom,
  onCreateRantTestRoom,
  onCreateRealtimeTestRoom,
  onSetRoomInactive,
  onSubmitStatement,
  onVoteOnStatement,
  onLogout,
  onOpenShowcase,
  onOpenAdminPanel,
  onOpenAdminDashboard,
  currentSubHeard,
  onSubHeardChange,
  roomStatements,
  onGetRoomStatements,
  onGetAllRoomStatements,
  targetRoomId,
  onRoomCreated,
}: LobbyScreenProps) {
  const [createRoomSheetOpen, setCreateRoomSheetOpen] =
    useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);
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
      const viewportHeight = window.visualViewport.height;
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
      window.visualViewport.removeEventListener(
        "resize",
        handleResize,
      );
      window.visualViewport.removeEventListener(
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

  const handleCreateSeedData = async () => {
    if (onCreateSeedData) {
      const result = await onCreateSeedData();
      if (result) {
        await onRefreshRooms();
        alert(
          `✅ ${result.message}\n\nCreated:\n• 1 test room with 4 players\n• ${result.statements} diverse statements\n• Various votes and types`,
        );
      }
    }
  };

  const handleCreateTestRoom = async () => {
    if (onCreateTestRoom) {
      const result = await onCreateTestRoom();
      if (result) {
        await onRefreshRooms();
        alert(
          `✅ ${result.message}\n\nCreated:\n• Q Street farmers market debate room\n• ${result.players} players ready to participate\n• No posts or votes yet - clean slate!`,
        );
      }
    }
  };

  const handleCreateRantTestRoom = async () => {
    if (onCreateRantTestRoom) {
      const result = await onCreateRantTestRoom();
      if (result) {
        await onRefreshRooms();
        alert(
          `✅ ${result.message}\n\nCreated:\n• ${result.players} players with diverse viewpoints\n• ${result.rants} detailed rants ready for compilation\n• Click "Compile Rants & Start Debate!" to test the system!`,
        );
      }
    }
  };

  const handleCreateRealtimeTestRoom = async () => {
    if (onCreateRealtimeTestRoom) {
      const result = await onCreateRealtimeTestRoom();
      if (result) {
        await onRefreshRooms();
        alert(
          `✅ ${result.message}\n\nCreated:\n• Real-time debate with 5-minute countdown\n• ${result.statements} diverse statements ready to vote on\n• ${result.players} players participating\n• Watch the countdown bar in action!`,
        );
      }
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    await onJoinRoom(roomId);
  };

  const handleOpenCreateSheet = () => {
    setDiscussTopic(undefined);
    setDiscussSubHeard(undefined);
    setCreateRoomSheetOpen(true);
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
    // Scroll to top after creating room
    if (onRoomCreated) {
      onRoomCreated();
    }
    roomScrollerRef.current?.scrollToTop();
    return result;
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
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className="flex flex-col"
              onClick={() => {
                if (user?.isDeveloper) {
                  setShowDebugPanel(!showDebugPanel);
                }
              }}
              style={{
                cursor: user?.isDeveloper
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
                currentUserId={user?.id}
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
              />
            )}

            {user && (
              <Sheet
                open={devMenuOpen}
                onOpenChange={setDevMenuOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/90 backdrop-blur-sm shadow-lg px-3 py-2 h-auto gap-2"
                  >
                    <span className="text-lg">⭐</span>
                    <span className="font-semibold">
                      {user.score}
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      User settings and options
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-4 mt-6">
                    {/* User info */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800">
                        <span className="font-medium">
                          {user.nickname}
                        </span>
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Score: {user.score}
                      </p>
                    </div>

                    {/* Logout */}
                    {onLogout && (
                      <Button
                        onClick={onLogout}
                        variant="outline"
                        className="w-full"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    )}

                    {/* Help button */}
                    <Button
                      onClick={() => {
                        setDevMenuOpen(false);
                        setHelpModalOpen(true);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Help
                    </Button>

                    {/* Admin Dashboard button - for community admins */}
                    {onOpenAdminDashboard && (
                      <Button
                        onClick={() => {
                          setDevMenuOpen(false);
                          onOpenAdminDashboard();
                        }}
                        variant="outline"
                        className="w-full bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
                      >
                        <BarChart3 className="w-4 h-4 mr-2 text-purple-600" />
                        Admin Dashboard
                      </Button>
                    )}

                    {/* Developer controls */}
                    {user?.isDeveloper && (
                      <>
                        <div className="border-t pt-4">
                          <h3 className="font-medium mb-3">
                            Developer Tools
                          </h3>
                          <div className="space-y-2">
                            {onOpenAdminPanel && (
                              <Button
                                onClick={() => {
                                  setDevMenuOpen(false);
                                  onOpenAdminPanel();
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full bg-purple-50 border-purple-200 text-purple-800"
                              >
                                <Shield className="w-3 h-3 mr-2" />
                                Admin Panel
                              </Button>
                            )}
                            {onOpenShowcase && (
                              <Button
                                onClick={() => {
                                  setDevMenuOpen(false);
                                  onOpenShowcase();
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full bg-slate-50 border-slate-200 text-slate-800"
                              >
                                <Code2 className="w-3 h-3 mr-2" />
                                Component Showcase
                              </Button>
                            )}
                            {onJumpToFinalResults && (
                              <Button
                                onClick={onJumpToFinalResults}
                                variant="outline"
                                size="sm"
                                className="w-full bg-yellow-50 border-yellow-200 text-yellow-800"
                              >
                                <SkipForward className="w-3 h-3 mr-2" />
                                Jump to Final Results
                              </Button>
                            )}
                            {onCreateSeedData && (
                              <Button
                                onClick={handleCreateSeedData}
                                variant="outline"
                                size="sm"
                                className="w-full bg-green-50 border-green-200 text-green-800"
                              >
                                <Database className="w-3 h-3 mr-2" />
                                Create Test Data
                              </Button>
                            )}
                            {onCreateTestRoom && (
                              <Button
                                onClick={handleCreateTestRoom}
                                variant="outline"
                                size="sm"
                                className="w-full bg-blue-50 border-blue-200 text-blue-800"
                              >
                                <Plus className="w-3 h-3 mr-2" />
                                Q Street Test Room
                              </Button>
                            )}
                            {onCreateRantTestRoom && (
                              <Button
                                onClick={
                                  handleCreateRantTestRoom
                                }
                                variant="outline"
                                size="sm"
                                className="w-full bg-purple-50 border-purple-200 text-purple-800"
                              >
                                <Brain className="w-3 h-3 mr-2" />
                                Rant-First Test Room
                              </Button>
                            )}
                            {onCreateRealtimeTestRoom && (
                              <Button
                                onClick={
                                  handleCreateRealtimeTestRoom
                                }
                                variant="outline"
                                size="sm"
                                className="w-full bg-orange-50 border-orange-200 text-orange-800"
                              >
                                <Clock className="w-3 h-3 mr-2" />
                                Real-time Test Room (5min)
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Room scroller */}
        <RoomScroller
          ref={roomScrollerRef}
          rooms={filteredRooms}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleOpenCreateSheet}
          onSetRoomInactive={onSetRoomInactive}
          onSubmitStatement={onSubmitStatement}
          onVoteOnStatement={onVoteOnStatement}
          isDeveloper={user?.isDeveloper || false}
          loading={loading}
          currentUserId={user?.id}
          currentSubHeard={currentSubHeard}
          onDiscussStatement={handleDiscussStatement}
          roomStatements={roomStatements}
          onGetRoomStatements={onGetRoomStatements}
          onGetAllRoomStatements={onGetAllRoomStatements}
        />
      </div>

      {/* Floating create button - hide when keyboard is open */}
      {!isKeyboardOpen && (
        <FloatingCreateButton
          onPress={() => setCreateRoomSheetOpen(true)}
        />
      )}

      {/* Floating feedback button - hide when keyboard is open */}
      {!isKeyboardOpen && (
        <FloatingFeedbackButton userId={user?.id} />
      )}

      {/* Create room sheet */}
      <CreateRoomSheet
        open={createRoomSheetOpen}
        userId={user?.id}
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
      {user?.isDeveloper && (
        <KeyboardDebugPanel
          show={showDebugPanel}
          isKeyboardOpen={isKeyboardOpen}
          viewportHeight={debugViewport.viewportHeight}
          windowHeight={debugViewport.windowHeight}
          ratio={debugViewport.ratio}
          initialWindowHeight={initialWindowHeightRef.current}
        />
      )}
    </>
  );
}