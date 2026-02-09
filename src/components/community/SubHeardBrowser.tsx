import type { SubHeard, UserSession } from "../../types";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Home, Hash, Plus, ChevronDown, Lock, Settings, Crown, LogOut } from "lucide-react";
import { useDebateSession } from "../../hooks/useDebateSession";
import { CommunityAdminDialog } from "./CommunityAdminDialog";
import { formatSubHeardDisplay } from "../../utils/subheard";

interface SubHeardBrowserProps {
  currentSubHeard?: string;
  user: UserSession;
  onSubHeardChange: (subHeard: string | null) => void;
  onCreateSubHeard: (name: string, userId: string, isPrivate?: boolean) => Promise<boolean>;
  onUpdateSubHeard: (
    update: SubHeard,
    userId: string,
  ) => Promise<boolean>;
  onShowAccountSetupModal: (featureText: string) => void;
}

export function SubHeardBrowser({
  currentSubHeard,
  user,
  onSubHeardChange,
  onCreateSubHeard,
  onUpdateSubHeard,
  onShowAccountSetupModal,
}: SubHeardBrowserProps) {
  const { getSubHeards, leaveSubHeard } = useDebateSession();
  const [subHeards, setSubHeards] = useState<SubHeard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newSubHeardName, setNewSubHeardName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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
      const response = await getSubHeards(user.id);
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
    setShowCreateNew(false);
    setNewSubHeardName("");
    setIsPrivate(false);
  };

  const handleCreateNew = async () => {
    if (!newSubHeardName.trim() || isCreating) return;

    const normalized = newSubHeardName.trim().toLowerCase().replace(/\s+/g, '-');
    
    setIsCreating(true);
    try {
      if (onCreateSubHeard) {
        const success = await onCreateSubHeard(normalized, user.id);
        if (success) {
          // Reload sub-heards to show the newly created one
          await loadSubHeards();
          // Select the new sub-heard
          handleSelectSubHeard(normalized);
        }
      } else {
        // Fallback: just select it without backend creation
        handleSelectSubHeard(normalized);
      }
    } catch (error) {
      console.error("Failed to create sub-heard:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    setSheetOpen(isOpen);
    if (!isOpen) {
      // Reset form when closing
      setShowCreateNew(false);
      setNewSubHeardName("");
      setIsPrivate(false);
    }
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
    
    const success = await onUpdateSubHeard(update, userId);
    if (!success) {
      setSubHeards(prev => 
        prev.map(sh => 
          sh.name === update.name 
            ? oldCommunity!
            : sh
        )
      );
    }
    return success;
  };

  const handleLeaveSubHeard = async (subHeardName: string) => {
    const response = await leaveSubHeard(subHeardName, user.id);
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
            className="controls-layer bg-white/90 backdrop-blur-sm shadow-lg max-w-[160px] h-[42px]"
          >
            {currentSubHeard ? (
              <Hash className="w-4 h-4 mr-1 flex-shrink-0" />
            ) : (
              <Home className="w-4 h-4 mr-1 flex-shrink-0" />
            )}
            <span className="truncate">{displayText}</span>
            {isCurrentAdmin && <Crown className="w-3 h-3 ml-1 text-yellow-500 flex-shrink-0" />}
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
            {/* All option */}
            <Button
              variant={!currentSubHeard ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSelectSubHeard(null)}
            >
              <Home className="w-4 h-4 mr-2" />
              All Posts
            </Button>

            {/* Existing sub-heards */}
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
                          <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
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
                        <Badge variant="secondary">{subHeard.count}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create new option */}
            {!showCreateNew ? (
              <Button
                variant="outline"
                className="w-full justify-start border-dashed"
                onClick={() => {
                  if (user.isAnonymous) {
                    onShowAccountSetupModal("creating communities");
                  } else {
                    setShowCreateNew(true);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Community
              </Button>
            ) : (
              <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="new-subheard">New Community Name</Label>
                  <Input
                    id="new-subheard"
                    placeholder="e.g., politics, technology..."
                    value={newSubHeardName}
                    onChange={(e) => setNewSubHeardName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isPrivate) {
                        handleCreateNew();
                      }
                    }}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="private-subheard"
                    checked={isPrivate}
                    onCheckedChange={(checked: boolean) => setIsPrivate(checked)}
                  />
                  <Label
                    htmlFor="private-subheard"
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <Lock className="w-3 h-3" />
                    Make unlisted (won't appear in public list)
                  </Label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateNew}
                    disabled={!newSubHeardName.trim() || isCreating}
                    className="flex-1"
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateNew(false);
                      setNewSubHeardName("");
                      setIsPrivate(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

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