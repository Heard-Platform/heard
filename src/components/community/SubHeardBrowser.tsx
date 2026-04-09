import type { SubHeard, UserSession } from "../../types";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Home, Hash, Plus, ChevronDown, EyeOff, Settings, Crown, LogOut, Compass } from "lucide-react";
import { MessageSquare } from "lucide-react";
import { useDebateSession } from "../../hooks/useDebateSession";
import { CommunityAdminDialog } from "./CommunityAdminDialog";
import { CreateCommunityDialog } from "./CreateCommunityDialog";
import { formatSubHeardDisplay } from "../../utils/subheard";
import { FeatureFlags, isFeatureEnabled } from "../../utils/constants/feature-flags";

interface SubHeardBrowserProps {
  currentSubHeard?: string;
  user: UserSession;
  onSubHeardChange: (subHeard: string | null) => void;
  onUpdateSubHeard: (
    update: SubHeard,
    userId: string,
  ) => Promise<boolean>;
  onShowAccountSetupModal: (featureText: string) => void;
  onOpenExplorer: () => void;
}

export function SubHeardBrowser({
  currentSubHeard,
  user,
  onSubHeardChange,
  onUpdateSubHeard,
  onShowAccountSetupModal,
  onOpenExplorer,
}: SubHeardBrowserProps) {
  const { getSubHeards, leaveSubHeard } = useDebateSession();
  const [subHeards, setSubHeards] = useState<SubHeard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [managingSubHeard, setManagingSubHeard] = useState<SubHeard | null>(null);

  useEffect(() => {
    loadSubHeards();
  }, [user.id]);

  useEffect(() => {
    if (sheetOpen) {
      loadSubHeards();
    }
  }, [sheetOpen]);

  const loadSubHeards = async () => {
    try {
      setLoading(true);
      const response = await getSubHeards();
      if (response?.success && response.data) {
        setSubHeards(response.data.subHeards);
      }
    } catch (error) {
      console.error("Failed to load sub-heards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubHeard = (subHeard: string | null) => {
    onSubHeardChange(subHeard);
    setSheetOpen(false);
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    setSheetOpen(isOpen);
  };

  const handleCommunityCreated = async (communityName: string) => {
    await loadSubHeards();
    handleSelectSubHeard(communityName);
  };

  const displayText = currentSubHeard
    ? formatSubHeardDisplay(currentSubHeard)
    : "All";

  const currentSubHeardData = subHeards.find(sh => sh.name === currentSubHeard);
  const isCurrentAdmin = currentSubHeardData?.adminId === user.id;

  const handleCommunityUpdate = async (update: SubHeard, userId: string) => {
    if (!onUpdateSubHeard) return false;
    
    const oldCommunity = subHeards.find(sh => sh.name === update.name);

    setSubHeards(prev => 
      prev.map(sh => 
        sh.name === update.name 
          ? { ...sh, ...update }
          : sh
      )
    );

    setManagingSubHeard(update);
    
    const success = await onUpdateSubHeard(update, userId);
    if (!success && oldCommunity) {
      setSubHeards(prev => 
        prev.map(sh => 
          sh.name === update.name 
            ? oldCommunity
            : sh
        )
      );

      setManagingSubHeard(oldCommunity);
    }
    return success;
  };

  const handleLeaveSubHeard = async (subHeardName: string) => {
    const response = await leaveSubHeard(subHeardName);
    if (response?.success) {
      await loadSubHeards();
      if (currentSubHeard === subHeardName) {
        onSubHeardChange(null);
      }
    }
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="controls-layer bg-white/90 backdrop-blur-sm shadow-lg h-[42px]"
            style={{ maxWidth: "120px" }}
          >
            {!currentSubHeard && (
              <Home className="w-4 h-4 mr-1 flex-shrink-0" />
            )}
            <span className="truncate">{displayText}</span>
            <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Browse Communities</SheetTitle>
            <SheetDescription>
              Select a community to filter posts by topic
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            {isFeatureEnabled(FeatureFlags.ONLY_JOINED_COMMUNITIES) && (
              <Button
                variant="outline"
                className="w-full justify-start bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400"
                onClick={() => {
                  setSheetOpen(false);
                  onOpenExplorer();
                }}
              >
                <Compass className="w-4 h-4 mr-2 text-green-600" />
                <span className="text-green-700">Browse New Communities</span>
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full justify-start p-3 bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400"
              onClick={() => {
                if (user.isAnonymous) {
                  onShowAccountSetupModal("creating communities");
                } else {
                  setShowCreateDialog(true);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-green-700">Create New Community</span>
            </Button>

            <Button
              variant={!currentSubHeard ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSelectSubHeard(null)}
            >
              <Home className="w-4 h-4 mr-2" />
              All Posts
            </Button>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {subHeards.map((subHeard) => {
                  const isAdmin = subHeard.adminId === user.id;
                  const isSelected = currentSubHeard === subHeard.name;
                  
                  return (
                    <div 
                      key={subHeard.name}
                      className={`flex items-center gap-2 w-full p-3 rounded-lg border ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <button
                        onClick={() => handleSelectSubHeard(subHeard.name)}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        <Hash className="w-4 h-4 flex-shrink-0" />
                        <span>{formatSubHeardDisplay(subHeard.name)}</span>
                        {subHeard.isPrivate && (
                          <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        )}
                        {isAdmin && (
                          <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                        )}
                      </button>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isAdmin && (
                          <button 
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-black/10"
                            onClick={() => setManagingSubHeard(subHeard)}
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}
                        {!isAdmin && (
                          <button 
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeaveSubHeard(subHeard.name);
                            }}
                          >
                            <LogOut className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {subHeard.count}
                          <MessageSquare className="w-3 h-3" />
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CreateCommunityDialog
        isOpen={showCreateDialog}
        userId={user.id}
        onCreated={handleCommunityCreated}
        onClose={() => setShowCreateDialog(false)}
      />

      {managingSubHeard && (
        <CommunityAdminDialog
          community={managingSubHeard}
          isOpen={true}
          onClose={() => setManagingSubHeard(null)}
          onUpdateSubHeard={handleCommunityUpdate}
          userId={user.id}
        />
      )}
    </>
  );
}