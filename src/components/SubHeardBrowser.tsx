import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Home, Hash, Plus, ChevronDown, Lock, Settings, Crown } from "lucide-react";
import { api } from "../utils/api";
import type { SubHeard } from "../types";

interface SubHeardBrowserProps {
  currentSubHeard?: string;
  currentUserId?: string;
  onSubHeardChange: (subHeard: string | null) => void;
  onCreateSubHeard?: (name: string, userId: string, isPrivate?: boolean) => Promise<boolean>;
  onUpdateSubHeard?: (name: string, userId: string, isPrivate: boolean) => Promise<boolean>;
}

export function SubHeardBrowser({
  currentSubHeard,
  currentUserId,
  onSubHeardChange,
  onCreateSubHeard,
  onUpdateSubHeard,
}: SubHeardBrowserProps) {
  const [subHeards, setSubHeards] = useState<SubHeard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newSubHeardName, setNewSubHeardName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load sub-heards on mount, when sheet opens, or when user changes
  useEffect(() => {
    loadSubHeards();
  }, [currentUserId]);

  useEffect(() => {
    if (sheetOpen) {
      loadSubHeards();
    }
  }, [sheetOpen]);

  const loadSubHeards = async () => {
    try {
      setLoading(true);
      const response = await api.getSubHeards(currentUserId);
      if (response.success && response.data) {
        setSubHeards(response.data.subHeards || []);
      }
    } catch (error) {
      console.error("Failed to load sub-heards:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSubHeardDisplay = (name: string) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSelectSubHeard = (subHeard: string | null) => {
    onSubHeardChange(subHeard);
    setSheetOpen(false);
    setShowCreateNew(false);
    setNewSubHeardName("");
    setIsPrivate(false);
  };

  const handleCreateNew = async () => {
    if (!newSubHeardName.trim() || isCreating || !currentUserId) return;

    const normalized = newSubHeardName.trim().toLowerCase().replace(/\s+/g, '-');
    
    setIsCreating(true);
    try {
      if (onCreateSubHeard) {
        const success = await onCreateSubHeard(normalized, currentUserId, isPrivate);
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

  const handleTogglePrivacy = async (subHeard: SubHeard, newPrivacy: boolean) => {
    if (!currentUserId || !onUpdateSubHeard) return;

    // Optimistic update - immediately update UI
    setSubHeards(prev => 
      prev.map(sh => 
        sh.name === subHeard.name 
          ? { ...sh, isPrivate: newPrivacy }
          : sh
      )
    );

    try {
      const success = await onUpdateSubHeard(subHeard.name, currentUserId, newPrivacy);
      if (!success) {
        // Revert on failure
        setSubHeards(prev => 
          prev.map(sh => 
            sh.name === subHeard.name 
              ? { ...sh, isPrivate: !newPrivacy }
              : sh
          )
        );
      }
    } catch (error) {
      console.error("Failed to update sub-heard privacy:", error);
      // Revert on error
      setSubHeards(prev => 
        prev.map(sh => 
          sh.name === subHeard.name 
            ? { ...sh, isPrivate: !newPrivacy }
            : sh
        )
      );
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
  const isCurrentAdmin = currentUserId && currentSubHeardData?.adminId === currentUserId;

  return (
    <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          {currentSubHeard ? (
            <Hash className="w-4 h-4 mr-1" />
          ) : (
            <Home className="w-4 h-4 mr-1" />
          )}
          {displayText}
          {isCurrentAdmin && <Crown className="w-3 h-3 ml-1 text-yellow-500" />}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Browse Sub-Heards</SheetTitle>
          <SheetDescription>
            Select a sub-heard to filter debates by topic
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
            All Debates
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
                const isAdmin = currentUserId && subHeard.adminId === currentUserId;
                
                return (
                  <Button
                    key={subHeard.name}
                    variant={
                      currentSubHeard === subHeard.name ? "default" : "outline"
                    }
                    className="w-full justify-between"
                    onClick={() => handleSelectSubHeard(subHeard.name)}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      {formatSubHeardDisplay(subHeard.name)}
                      {subHeard.isPrivate && (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <Popover modal={false}>
                          <PopoverTrigger asChild>
                            <button
                              className="p-1 hover:bg-black/10 rounded"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64" onInteractOutside={(e) => e.preventDefault()}>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Sub-Heard Settings</h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatSubHeardDisplay(subHeard.name)}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label htmlFor={`private-${subHeard.name}`}>
                                    Private
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    Only accessible via link
                                  </p>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Switch
                                    id={`private-${subHeard.name}`}
                                    checked={subHeard.isPrivate || false}
                                    onCheckedChange={(checked) => {
                                      handleTogglePrivacy(subHeard, checked);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                      <Badge variant="secondary">{subHeard.count}</Badge>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Create new option */}
          {!showCreateNew ? (
            <Button
              variant="outline"
              className="w-full justify-start border-dashed"
              onClick={() => setShowCreateNew(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Sub-Heard
            </Button>
          ) : (
            <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="new-subheard">New Sub-Heard Name</Label>
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
                  onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                />
                <Label
                  htmlFor="private-subheard"
                  className="text-sm cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-3 h-3" />
                  Make private (only accessible via link)
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
  );
}
