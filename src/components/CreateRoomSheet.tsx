import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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
import { Plus, Hash, Sparkles, MessageCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  defaultTopic?: string;
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
  defaultTopic,
}: CreateRoomSheetProps) {
  const [newRoomTopic, setNewRoomTopic] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [showExamples, setShowExamples] = useState(false);
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

  // Update topic when defaultTopic changes or when sheet opens
  useEffect(() => {
    if (open) {
      setNewRoomTopic(defaultTopic || "");
    }
  }, [open, defaultTopic]);

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
        "realtime", // Always use realtime mode
        true, // Always enable rant-first mode
        newRoomDescription.trim() || undefined,
        finalSubHeard
      );
      
      // Reset form (keep subHeard if it was a default)
      setNewRoomTopic("");
      setNewRoomDescription("");
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
        className="h-[90vh] overflow-y-auto rounded-t-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-0 px-5"
      >
        <SheetHeader className="space-y-2 pt-4">
          <div className="flex items-center justify-center gap-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </motion.div>
            <SheetTitle className="text-3xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Start a Debate
            </SheetTitle>
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <MessageCircle className="w-6 h-6 text-teal-600" />
            </motion.div>
          </div>
          <SheetDescription className="text-center text-sm text-slate-600">
            What's on your mind? Let's hash it out! 💬
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pb-32">
          {/* Topic Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-teal-600" />
                <Label htmlFor="topic-input" className="text-base text-slate-700">
                  What should we debate?
                </Label>
              </div>
              <Input
                id="topic-input"
                type="text"
                placeholder="What's the hot take? Drop it here..."
                maxLength={100}
                value={newRoomTopic}
                onChange={(e) => setNewRoomTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isTopicValid) {
                    handleCreateRoom();
                  }
                }}
                className="h-12 bg-white border-teal-200 hover:border-teal-300 transition-colors placeholder:text-slate-400"
              />
              <div className="flex justify-between items-center text-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExamples(!showExamples)}
                  className="text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-100/50 flex items-center gap-1 h-auto px-2 py-1 -ml-2"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {showExamples ? "Hide" : "Need inspiration?"} 
                </Button>
                {newRoomTopic.trim().length > 0 && !isTopicValid && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-orange-600 flex items-center gap-1"
                  >
                    <span>⏳</span>
                    Need {remainingChars} more character
                    {remainingChars !== 1 ? "s" : ""}
                  </motion.span>
                )}
                {isTopicValid && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-emerald-600 flex items-center gap-1"
                  >
                    <span>✨</span> Looking spicy!
                  </motion.span>
                )}
                <span className="text-slate-500 ml-auto">
                  {newRoomTopic.length}/100
                </span>
              </div>
            </div>
          </motion.div>

          {/* Example Topics */}
          <AnimatePresence>
            {showExamples && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden -mt-3"
              >
                {topicExamples.map((topic, index) => (
                  <motion.div
                    key={topic}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleClick(topic)}
                      className="w-full text-left justify-start h-auto py-3 px-4 bg-white/50 hover:bg-white border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 transition-all"
                    >
                      <span className="mr-2">💡</span>
                      <span className="text-sm">{topic}</span>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100"
          >
            <div className="space-y-3">
              <Label htmlFor="description-input" className="text-sm text-slate-600 flex items-center gap-1.5">
                <span>📝</span> Add some context (optional)
              </Label>
              <Textarea
                id="description-input"
                placeholder="Set the stage, lay down some ground rules, add some flavor..."
                maxLength={2000}
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
                className="w-full min-h-[90px] resize-none bg-white border-emerald-200 hover:border-emerald-300 transition-colors placeholder:text-slate-400"
                rows={3}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  Help everyone get on the same page
                </span>
                <span className="text-slate-400">
                  {newRoomDescription.length}/2000
                </span>
              </div>
            </div>
          </motion.div>

          {/* Sub-Heard Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-emerald-600" />
                <Label htmlFor="subheard-select" className="text-base text-slate-700">
                  Where should this debate live?
                </Label>
              </div>
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
                <SelectTrigger id="subheard-select" className="h-12 bg-white border-emerald-200 hover:border-emerald-300 transition-colors">
                  <SelectValue placeholder="Choose a community..." />
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
                      Create New Community
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Create new sub-heard input */}
              <AnimatePresence>
                {showCreateNewSubHeard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-4 bg-purple-50/50 border-2 border-dashed border-purple-200 rounded-xl space-y-2">
                      <Label htmlFor="new-subheard-name" className="text-sm text-purple-800">
                        New Sub-Heard Name ✨
                      </Label>
                      <Input
                        id="new-subheard-name"
                        placeholder="e.g., politics, technology..."
                        value={newSubHeardName}
                        onChange={(e) => setNewSubHeardName(e.target.value)}
                        maxLength={50}
                        className="bg-white border-purple-200"
                      />
                      <p className="text-xs text-purple-600/80">
                        Choose a clear, concise name for your community
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Create Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleCreateRoom}
              disabled={
                !isTopicValid ||
                isCreating ||
                !subHeard ||
                (subHeard === "create-new" && !newSubHeardName.trim())
              }
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
            >
              {isCreating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  <span className="text-base">Creating your debate...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  <span className="text-base">Let's Go! 🚀</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
