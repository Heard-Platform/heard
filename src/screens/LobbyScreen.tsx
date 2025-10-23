import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { RoomScroller } from "../components/RoomScroller";
import { CreateRoomSheet } from "../components/CreateRoomSheet";
import {
  Plus,
  Database,
  LogOut,
  Brain,
  Code2,
  SkipForward,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import type {
  UserSession,
  DebateRoom,
  DebateMode,
} from "../types";

interface LobbyScreenProps {
  user: UserSession | null;
  activeRooms: DebateRoom[];
  loading: boolean;
  error: string | null;
  onCreateRoom: (
    topic: string,
    mode: DebateMode,
    rantFirst?: boolean,
    description?: string,
  ) => Promise<void>;
  onJoinRoom: (roomId: string) => Promise<void>;
  onRefreshRooms: () => Promise<DebateRoom[]>;
  onJumpToFinalResults?: () => Promise<void>;
  onCreateSeedData?: () => Promise<any>;
  onCreateTestRoom?: () => Promise<any>;
  onCreateRantTestRoom?: () => Promise<any>;
  onUpdateRoomDescription?: (description: string) => Promise<boolean>;
  onSetRoomInactive?: (roomId: string) => Promise<boolean>;
  onLogout?: () => void;
  onOpenShowcase?: () => void;
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
  onSetRoomInactive,
  onLogout,
  onOpenShowcase,
}: LobbyScreenProps) {
  const [createRoomSheetOpen, setCreateRoomSheetOpen] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);

  // Filter out rooms older than a week (7 days)
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const filteredRooms = activeRooms.filter(room => room.createdAt > oneWeekAgo);

  // Refresh rooms on mount
  useEffect(() => {
    onRefreshRooms();
  }, []);

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

  const handleJoinRoom = async (roomId: string) => {
    await onJoinRoom(roomId);
  };

  const handleOpenCreateSheet = () => {
    setCreateRoomSheetOpen(true);
  };

  return (
    <>
      {/* Main TikTok-style scroller */}
      <div className="relative">
        {/* Floating header with user info and menu */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start">
          <div className="flex items-center gap-2">
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg"
              style={{ WebkitTextStroke: "1px rgba(255,255,255,0.8)" }}
            >
              HEARD
            </motion.h1>
            {user?.isDeveloper && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                DEV
              </Badge>
            )}
          </div>

          {/* User menu button */}
          {user && (
            <Sheet open={devMenuOpen} onOpenChange={setDevMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm shadow-lg"
                >
                  <Menu className="w-4 h-4 mr-2" />
                  Menu
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
                      <span className="font-medium">{user.nickname}</span>
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

                  {/* Developer controls */}
                  {user?.isDeveloper && (
                    <>
                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-3">Developer Tools</h3>
                        <div className="space-y-2">
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
                              onClick={handleCreateRantTestRoom}
                              variant="outline"
                              size="sm"
                              className="w-full bg-purple-50 border-purple-200 text-purple-800"
                            >
                              <Brain className="w-3 h-3 mr-2" />
                              Rant-First Test Room
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

        {/* Room scroller */}
        <RoomScroller
          rooms={filteredRooms}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleOpenCreateSheet}
          onSetRoomInactive={onSetRoomInactive}
          isDeveloper={user?.isDeveloper || false}
          loading={loading}
        />
      </div>

      {/* Create room sheet */}
      <CreateRoomSheet
        open={createRoomSheetOpen}
        onOpenChange={setCreateRoomSheetOpen}
        onCreateRoom={onCreateRoom}
      />

      {/* Error notification */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}
    </>
  );
}
