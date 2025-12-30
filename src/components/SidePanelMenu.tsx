import { useState } from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  LogOut,
  HelpCircle,
  Code2,
  BarChart3,
  Wrench,
  Shield,
  SkipForward,
  Database,
  Plus,
  Brain,
  Clock,
  Link2,
  AlertCircle, User
} from "lucide-react";
import type { UserSession } from "../types";
import { useDebateSession } from "../hooks/useDebateSession";

interface SidePanelMenuProps {
  user: UserSession;
  onLogout: () => void;
  onOpenHelp: () => void;
  onOpenShowcase?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenDevTools?: () => void;
  onOpenAdminPanel?: () => void;
  onJumpToFinalResults?: () => void;
  onCreateAnonDebate?: () => void;
  onShowAccountSetupModal: (featureText: string) => void;
}

export function SidePanelMenu({
  user,
  onLogout,
  onOpenHelp,
  onOpenShowcase,
  onOpenAdminDashboard,
  onOpenDevTools,
  onOpenAdminPanel,
  onJumpToFinalResults,
  onCreateAnonDebate,
  onShowAccountSetupModal,
}: SidePanelMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    createSeedData,
    createTestRoom,
    createRantTestRoom,
    createRealtimeTestRoom,
  } = useDebateSession();

  const closeMenuAndRun = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  const handleCreateSeedData = async () => {
    try {
      await createSeedData();
      alert("✅ Seed data created successfully!");
    } catch (error) {
      console.error("Error creating seed data:", error);
      alert("❌ Failed to create seed data");
    }
  };

  const handleCreateTestRoom = async () => {
    try {
      await createTestRoom();
      alert("✅ Q Street test room created!");
    } catch (error) {
      console.error("Error creating test room:", error);
      alert("❌ Failed to create test room");
    }
  };

  const handleCreateRantTestRoom = async () => {
    try {
      await createRantTestRoom();
      alert("✅ Rant-first test room created!");
    } catch (error) {
      console.error("Error creating rant test room:", error);
      alert("❌ Failed to create rant test room");
    }
  };

  const handleCreateRealtimeTestRoom = async () => {
    try {
      await createRealtimeTestRoom();
      alert("✅ Real-time test room created!");
    } catch (error) {
      console.error("Error creating realtime test room:", error);
      alert("❌ Failed to create realtime test room");
    }
  };

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="controls-layer bg-white/90 backdrop-blur-sm shadow-lg px-3 py-2 h-auto gap-2 border-2"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{user.score}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>User settings and options</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6 overflow-y-auto flex-1 pr-2">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              <span className="font-medium">{user.nickname}</span>
            </p>
            <p className="text-sm text-green-600 mt-1">
              Score: {user.score}
            </p>
          </div>

          {user.isAnonymous && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-orange-800 font-medium text-sm">
                    Your score won't be saved
                  </p>
                  <p className="text-orange-700 text-xs mt-1">
                    Setup an account to keep your progress and unlock more features
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setMenuOpen(false);
                  onShowAccountSetupModal("saving your progress");
                }}
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Setup Account
              </Button>
            </div>
          )}

          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>

          <Button
            onClick={() => closeMenuAndRun(onOpenHelp)}
            variant="outline"
            className="w-full"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>

          {onOpenShowcase && (
            <Button
              onClick={() => closeMenuAndRun(onOpenShowcase)}
              variant="outline"
              className="w-full"
            >
              <Code2 className="w-4 h-4 mr-2" />
              Component Showcase
            </Button>
          )}

          {onOpenAdminDashboard && (
            <Button
              onClick={() => closeMenuAndRun(onOpenAdminDashboard)}
              variant="outline"
              className="w-full bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
            >
              <BarChart3 className="w-4 h-4 mr-2 text-purple-600" />
              Admin Dashboard
            </Button>
          )}

          {user?.isDeveloper && (
            <>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Developer Tools</h3>
                <div className="space-y-2">
                  {onOpenDevTools && (
                    <Button
                      onClick={() => closeMenuAndRun(onOpenDevTools)}
                      variant="outline"
                      size="sm"
                      className="w-full bg-blue-50 border-blue-200 text-blue-800"
                    >
                      <Wrench className="w-3 h-3 mr-2" />
                      Dev Tools
                    </Button>
                  )}
                  {onOpenAdminPanel && (
                    <Button
                      onClick={() => closeMenuAndRun(onOpenAdminPanel)}
                      variant="outline"
                      size="sm"
                      className="w-full bg-purple-50 border-purple-200 text-purple-800"
                    >
                      <Shield className="w-3 h-3 mr-2" />
                      Admin Panel
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
                  {onCreateAnonDebate && (
                    <Button
                      onClick={onCreateAnonDebate}
                      variant="outline"
                      size="sm"
                      className="w-full bg-teal-50 border-teal-200 text-teal-800"
                    >
                      <Link2 className="w-3 h-3 mr-2" />
                      Create Anon Debate
                    </Button>
                  )}
                  <Button
                    onClick={handleCreateSeedData}
                    variant="outline"
                    size="sm"
                    className="w-full bg-green-50 border-green-200 text-green-800"
                  >
                    <Database className="w-3 h-3 mr-2" />
                    Create Test Data
                  </Button>
                  <Button
                    onClick={handleCreateTestRoom}
                    variant="outline"
                    size="sm"
                    className="w-full bg-blue-50 border-blue-200 text-blue-800"
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    Q Street Test Room
                  </Button>
                  <Button
                    onClick={handleCreateRantTestRoom}
                    variant="outline"
                    size="sm"
                    className="w-full bg-purple-50 border-purple-200 text-purple-800"
                  >
                    <Brain className="w-3 h-3 mr-2" />
                    Rant-First Test Room
                  </Button>
                  <Button
                    onClick={handleCreateRealtimeTestRoom}
                    variant="outline"
                    size="sm"
                    className="w-full bg-orange-50 border-orange-200 text-orange-800"
                  >
                    <Clock className="w-3 h-3 mr-2" />
                    Real-time Test Room (5min)
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}