import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Brain, Clock, Plus, Hash, Home } from "lucide-react";
import { api } from "../utils/api";
import type { DebateMode, SubHeard } from "../types";

interface CreateRoomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (
    topic: string,
    mode: DebateMode,
    rantFirst?: boolean,
    description?: string,
    subHeard?: string
  ) => Promise<void>;
  defaultSubHeard?: string;
}

const topicExamples = [
  "Social media does more harm than good for society",
  "Remote work is better than in-person work",
  "AI will solve more problems than it creates",
  "Democracy is the best form of government",
  "Economic growth should be prioritized over environmental protection",
];

export function CreateRoomSheet({
  open,
  onOpenChange,
  onCreateRoom,
  defaultSubHeard,
}: CreateRoomSheetProps) {
  const [newRoomTopic, setNewRoomTopic] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const [debateMode, setDebateMode] = useState<DebateMode>("host-controlled");
  const [rantFirst, setRantFirst] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [subHeard, setSubHeard] = useState(defaultSubHeard || "");
  const [subHeards, setSubHeards] = useState<SubHeard[]>([]);
  const [loadingSubHeards, setLoadingSubHeards] = useState(true);
  const [showCreateNewSubHeard, setShowCreateNewSubHeard] = useState(false);
  const [newSubHeardName, setNewSubHeardName] = useState("");

  const isTopicValid = newRoomTopic.trim().length >= 10;
  const remainingChars = 10 - newRoomTopic.trim().length;

  // Load sub-heards when sheet opens
  useEffect(() => {
    if (open) {
      loadSubHeards();
    }
  }, [open]);

  // Update subHeard when defaultSubHeard changes
  useEffect(() => {
    if (defaultSubHeard) {
      setSubHeard(defaultSubHeard);
    }
  }, [defaultSubHeard]);

  const loadSubHeards = async () => {
    try {
      setLoadingSubHeards(true);
      const response = await api.getSubHeards();
      if (response.success && response.data) {
        setSubHeards(response.data.subHeards || []);
      }
    } catch (error) {
      console.error("Failed to load sub-heards:", error);
    } finally {
      setLoadingSubHeards(false);
    }
  };

  const formatSubHeardDisplay = (name: string) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleCreateRoom = async () => {
    if (!isTopicValid || isCreating || !subHeard) return;
    
    setIsCreating(true);
    try {
      // If creating a new sub-heard, use the new name
      const finalSubHeard = subHeard === "create-new" && newSubHeardName.trim()
        ? newSubHeardName.trim().toLowerCase().replace(/\s+/g, '-')
        : subHeard;

      await onCreateRoom(
        newRoomTopic.trim(),
        debateMode,
        rantFirst,
        newRoomDescription.trim() || undefined,
        finalSubHeard
      );
      
      // Reset form (keep subHeard if it was a default)
      setNewRoomTopic("");
      setNewRoomDescription("");
      setDebateMode("host-controlled");
      setRantFirst(true);
      setShowCreateNewSubHeard(false);
      setNewSubHeardName("");
      // Reset subHeard to default or empty
      setSubHeard(defaultSubHeard || "");
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExampleClick = (topic: string) => {
    setNewRoomTopic(topic);
    setShowExamples(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset create new sub-heard form when closing
      setShowCreateNewSubHeard(false);
      setNewSubHeardName("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl">Create New Debate Room</SheetTitle>
          <SheetDescription>
            Set up your debate topic and preferences
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Sub-Heard Selector */}
          <div className="space-y-2">
            <Label htmlFor="subheard-select">Sub-Heard</Label>
            <Select
              value={subHeard || undefined}
              onValueChange={(value) => {
                setSubHeard(value);
                setShowCreateNewSubHeard(value === "create-new");
                if (value !== "create-new") {
                  setNewSubHeardName("");
                }
              }}
            >
              <SelectTrigger id="subheard-select">
                <SelectValue placeholder="Select a sub-heard..." />
              </SelectTrigger>
              <SelectContent>
                {subHeards.map((sh) => (
                  <SelectItem key={sh.name} value={sh.name}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 mr-2" />
                        {formatSubHeardDisplay(sh.name)}
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({sh.count})
                      </span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="create-new">
                  <div className="flex items-center text-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Sub-Heard
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Create new sub-heard input */}
            {showCreateNewSubHeard && (
              <div className="mt-2 p-3 border-2 border-dashed rounded-lg space-y-2">
                <Label htmlFor="new-subheard-name">New Sub-Heard Name</Label>
                <Input
                  id="new-subheard-name"
                  placeholder="e.g., politics, technology..."
                  value={newSubHeardName}
                  onChange={(e) => setNewSubHeardName(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a clear, concise name for your sub-heard
                </p>
              </div>
            )}
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic-input">What should we debate?</Label>
            <Input
              id="topic-input"
              type="text"
              placeholder="Enter your debate topic (min. 10 characters)..."
              maxLength={100}
              value={newRoomTopic}
              onChange={(e) => setNewRoomTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isTopicValid) {
                  handleCreateRoom();
                }
              }}
              className="w-full"
            />
            <div className="flex justify-between items-center text-xs">
              {newRoomTopic.trim().length > 0 && !isTopicValid && (
                <span className="text-orange-600">
                  Need {remainingChars} more character
                  {remainingChars !== 1 ? "s" : ""}
                </span>
              )}
              {isTopicValid && (
                <span className="text-green-600">✓ Topic looks good!</span>
              )}
              <span className="text-muted-foreground ml-auto">
                {newRoomTopic.length}/100
              </span>
            </div>
          </div>

          {/* Example Topics */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showExamples ? "Hide" : "Show"} example topics
            </Button>

            {showExamples && (
              <div className="space-y-1">
                {topicExamples.map((topic) => (
                  <Button
                    key={topic}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExampleClick(topic)}
                    className="w-full text-left justify-start text-xs h-auto py-2 text-muted-foreground hover:text-foreground"
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description-input">Description (Optional)</Label>
            <Textarea
              id="description-input"
              placeholder="Provide context, background, or rules for this debate... (supports Markdown)"
              maxLength={2000}
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              className="w-full min-h-[80px] resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                Add context to help participants understand the topic
              </span>
              <span className="text-muted-foreground">
                {newRoomDescription.length}/2000
              </span>
            </div>
          </div>

          {/* Debate Settings */}
          <div className="space-y-3">
            <Label className="text-sm">Debate Style</Label>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Brain className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm">Rant First Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Players write rants, then statements are auto-generated
                  </p>
                </div>
              </div>
              <Switch checked={rantFirst} onCheckedChange={setRantFirst} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm">Enable Real-time Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Phases advance automatically with timers
                  </p>
                </div>
              </div>
              <Switch
                checked={debateMode === "realtime"}
                onCheckedChange={(checked) =>
                  setDebateMode(checked ? "realtime" : "host-controlled")
                }
              />
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateRoom}
            disabled={
              !isTopicValid ||
              isCreating ||
              !subHeard ||
              (subHeard === "create-new" && !newSubHeardName.trim())
            }
            className="w-full"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? "Creating..." : "Create New Room"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
