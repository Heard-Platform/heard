import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { ActiveRoomsList } from "../components/ActiveRoomsList";
import {
  Plus,
  Database,
  Clock,
  User,
  LogOut,
  Brain,
} from "lucide-react";
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
  onLogout?: () => void;
}

const topicExamples = [
  "Social media does more harm than good for society",
  "Remote work is better than in-person work",
  "AI will solve more problems than it creates",
  "Democracy is the best form of government",
  "Economic growth should be prioritized over environmental protection",
];

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
  onLogout,
}: LobbyScreenProps) {
  const [newRoomTopic, setNewRoomTopic] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const [debateMode, setDebateMode] = useState<DebateMode>(
    "host-controlled",
  );
  const [rantFirst, setRantFirst] = useState(true);

  const isTopicValid = newRoomTopic.trim().length >= 10;
  const remainingChars = 10 - newRoomTopic.trim().length;

  const handleCreateRoom = async () => {
    if (!isTopicValid) return;
    await onCreateRoom(
      newRoomTopic.trim(),
      debateMode,
      rantFirst,
      newRoomDescription.trim() || undefined,
    );
    setNewRoomTopic(""); // Clear the input after creating
    setNewRoomDescription(""); // Clear the description after creating
    setDebateMode("host-controlled"); // Reset to default
    setRantFirst(true); // Reset to default
  };

  const handleExampleClick = (topic: string) => {
    setNewRoomTopic(topic);
    setShowExamples(false);
  };

  const handleCreateSeedData = async () => {
    if (onCreateSeedData) {
      const result = await onCreateSeedData();
      if (result) {
        alert(
          `✅ ${result.message}\n\nCreated:\n• 1 test room with 4 players\n• ${result.statements} diverse statements\n• Various votes and types\n\nCheck the "Join Existing Room" section!`,
        );
      }
    }
  };

  const handleCreateTestRoom = async () => {
    if (onCreateTestRoom) {
      const result = await onCreateTestRoom();
      if (result) {
        alert(
          `✅ ${result.message}\\n\\nCreated:\\n• Q Street farmers market debate room\\n• ${result.players} players ready to participate\\n• No posts or votes yet - clean slate!\\n\\nCheck the \"Join Existing Room\" section!`,
        );
      }
    }
  };

  const handleCreateRantTestRoom = async () => {
    if (onCreateRantTestRoom) {
      const result = await onCreateRantTestRoom();
      if (result) {
        alert(
          `✅ ${result.message}\\n\\nCreated:\\n• ${result.players} players with diverse viewpoints\\n• ${result.rants} detailed rants ready for compilation\\n• Click "Compile Rants & Start Debate!" to test the system!\\n\\nCheck the \"Join Existing Room\" section!`,
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-6 max-w-2xl w-full"
      >
        <div className="flex items-center justify-center gap-3">
          <motion.h1
            className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            HEARD
          </motion.h1>
          {user?.isDeveloper && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              DEV
            </Badge>
          )}
        </div>
        <p className="text-xl text-muted-foreground">
          An app for arguing (and secretly saving democracy)
        </p>

        {user && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <p className="text-green-800">
                Welcome back,{" "}
                <span className="font-medium">
                  {user.nickname}
                </span>
                !
                <span className="ml-2 text-sm">
                  Score: {user.score}
                </span>
              </p>
              {onLogout && (
                <Button
                  onClick={onLogout}
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-800 hover:bg-green-100"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6 text-left">
          <h3 className="mb-3">🎮 How to Play:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Write a rant on the debate topic</li>
            <li>• Your rant gets transformed into clear statements</li>
            <li>• Swipe to vote on everyone's statements</li>
            <li>
              • Find <Badge variant="outline">🌉 Bridges</Badge>{" "}
              between different views
            </li>
            <li>
              • Identify{" "}
              <Badge variant="outline">⚡ Cruxes</Badge> at the
              heart of disagreements
            </li>
            <li>
              • Discover{" "}
              <Badge variant="outline">💎 Pluralities</Badge> -
              underrepresented perspectives
            </li>
            <li>• Solve the debate by finding the best mix of ideas!</li>
          </ul>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="mb-4">🏛️ Create New Debate Room</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic-input">
                  What should we debate?
                </Label>
                <Input
                  id="topic-input"
                  type="text"
                  placeholder="Enter your debate topic (min. 10 characters)..."
                  maxLength={100}
                  value={newRoomTopic}
                  onChange={(e) =>
                    setNewRoomTopic(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isTopicValid) {
                      handleCreateRoom();
                    }
                  }}
                  className="w-full"
                />
                <div className="flex justify-between items-center text-xs">
                  {newRoomTopic.trim().length > 0 &&
                    !isTopicValid && (
                      <span className="text-orange-600">
                        Need {remainingChars} more character
                        {remainingChars !== 1 ? "s" : ""}
                      </span>
                    )}
                  {isTopicValid && (
                    <span className="text-green-600">
                      ✓ Topic looks good!
                    </span>
                  )}
                  <span className="text-muted-foreground ml-auto">
                    {newRoomTopic.length}/100
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-input">
                  Description (Optional)
                </Label>
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

              <div className="space-y-3">
                <Label className="text-sm">Debate Style</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-sm">Rant First Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Players write rants, then statements are
                        auto-generated
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={rantFirst}
                    onCheckedChange={setRantFirst}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm">
                        Enable Real-time Mode
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Phases advance automatically with timers
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={debateMode === "realtime"}
                    onCheckedChange={(checked) =>
                      setDebateMode(
                        checked
                          ? "realtime"
                          : "host-controlled",
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExamples(!showExamples)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showExamples ? "Hide" : "Show"} example
                  topics
                </Button>

                {showExamples && (
                  <div className="space-y-1">
                    {topicExamples.map((topic) => (
                      <Button
                        key={topic}
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleExampleClick(topic)
                        }
                        className="w-full text-left justify-start text-xs h-auto py-2 text-muted-foreground hover:text-foreground"
                      >
                        {topic}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateRoom}
                disabled={!isTopicValid}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Room
              </Button>
            </div>
          </Card>

          {/* Only show active rooms list to developers */}
          {user?.isDeveloper && (
            <ActiveRoomsList
              rooms={activeRooms}
              onJoinRoom={onJoinRoom}
              onRefresh={onRefreshRooms}
              loading={loading}
            />
          )}
        </div>

        {/* Developer-only controls */}
        {user?.isDeveloper && (
          <div className="flex flex-wrap gap-3 justify-center">
            {onJumpToFinalResults && (
              <Button
                onClick={onJumpToFinalResults}
                variant="outline"
                size="sm"
                className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
              >
                🚧 DEV: Jump to Final Results
              </Button>
            )}
            {onCreateSeedData && (
              <Button
                onClick={handleCreateSeedData}
                variant="outline"
                size="sm"
                className="text-xs bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
              >
                <Database className="w-3 h-3 mr-1" />
                🧪 DEV: Create Test Data
              </Button>
            )}
            {onCreateTestRoom && (
              <Button
                onClick={handleCreateTestRoom}
                variant="outline"
                size="sm"
                className="text-xs bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
              >
                <Plus className="w-3 h-3 mr-1" />
                🏛️ DEV: Q Street Test Room
              </Button>
            )}
            {onCreateRantTestRoom && (
              <Button
                onClick={handleCreateRantTestRoom}
                variant="outline"
                size="sm"
                className="text-xs bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
              >
                <Brain className="w-3 h-3 mr-1" />
                🧠 DEV: Rant-First Test Room
              </Button>
            )}
          </div>
        )}

        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </Card>
        )}
      </motion.div>
    </div>
  );
}