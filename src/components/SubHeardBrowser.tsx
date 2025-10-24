import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Home, Hash, Plus, ChevronDown } from "lucide-react";
import { api } from "../utils/api";
import type { SubHeard } from "../types";

interface SubHeardBrowserProps {
  currentSubHeard?: string;
  onSubHeardChange: (subHeard: string | null) => void;
  onCreateSubHeard?: (name: string) => Promise<boolean>;
}

export function SubHeardBrowser({
  currentSubHeard,
  onSubHeardChange,
  onCreateSubHeard,
}: SubHeardBrowserProps) {
  const [subHeards, setSubHeards] = useState<SubHeard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newSubHeardName, setNewSubHeardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load sub-heards on mount and when sheet opens
  useEffect(() => {
    loadSubHeards();
  }, []);

  useEffect(() => {
    if (sheetOpen) {
      loadSubHeards();
    }
  }, [sheetOpen]);

  const loadSubHeards = async () => {
    try {
      setLoading(true);
      const response = await api.getSubHeards();
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
  };

  const handleCreateNew = async () => {
    if (!newSubHeardName.trim() || isCreating) return;

    const normalized = newSubHeardName.trim().toLowerCase().replace(/\s+/g, '-');
    
    setIsCreating(true);
    try {
      if (onCreateSubHeard) {
        const success = await onCreateSubHeard(normalized);
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
    }
  };

  const displayText = currentSubHeard
    ? formatSubHeardDisplay(currentSubHeard)
    : "All";

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
              {subHeards.map((subHeard) => (
                <Button
                  key={subHeard.name}
                  variant={
                    currentSubHeard === subHeard.name ? "default" : "outline"
                  }
                  className="w-full justify-between"
                  onClick={() => handleSelectSubHeard(subHeard.name)}
                >
                  <div className="flex items-center">
                    <Hash className="w-4 h-4 mr-2" />
                    {formatSubHeardDisplay(subHeard.name)}
                  </div>
                  <Badge variant="secondary">{subHeard.count}</Badge>
                </Button>
              ))}
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
              <Label htmlFor="new-subheard">New Sub-Heard Name</Label>
              <Input
                id="new-subheard"
                placeholder="e.g., politics, technology..."
                value={newSubHeardName}
                onChange={(e) => setNewSubHeardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateNew();
                  }
                }}
              />
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
