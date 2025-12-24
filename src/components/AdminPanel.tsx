/**
 * Developer Admin Panel for Heard
 *
 * Access: Add ?admin=true to the URL (e.g., https://yourapp.com?admin=true)
 * Authentication: Requires DEV_ADMIN_KEY environment variable
 *
 * Features:
 * - View all users and sub-heards
 * - Change sub-heard admins
 */

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Shield,
  Lock,
  User,
  Crown,
  X,
  ToggleLeft,
  ToggleRight,
  TestTube,
} from "lucide-react";
import { api } from "../utils/api";
import type { DebateRoom, SubHeard } from "../types";
import { PolisImporter } from "./PolisImporter";

interface AdminUser {
  userId: string;
  name: string;
  lastSeen: number;
}

interface AdminPanelProps {
  onExit?: () => void;
}

export function AdminPanel({ onExit }: AdminPanelProps) {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subHeards, setSubHeards] = useState<SubHeard[]>([]);
  const [debates, setDebates] = useState<DebateRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubHeard, setSelectedSubHeard] =
    useState<SubHeard | null>(null);
  const [newAdminId, setNewAdminId] = useState("");
  const [renameSubHeard, setRenameSubHeard] =
    useState<SubHeard | null>(null);
  const [newSubHeardName, setNewSubHeardName] = useState("");
  const [togglingDebateId, setTogglingDebateId] = useState<
    string | null
  >(null);
  const [dataFixLoading, setDataFixLoading] = useState<
    string | null
  >(null);
  const [redditUrl, setRedditUrl] = useState("");
  const [redditSubHeard, setRedditSubHeard] = useState("");
  const [creatingRedditRoom, setCreatingRedditRoom] =
    useState(false);
  const [selectedDebate, setSelectedDebate] =
    useState<DebateRoom | null>(null);
  const [newDebateSubHeard, setNewDebateSubHeard] =
    useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("subheards");

  const fetchAdminData = async () => {
    if (!adminKey) return;

    setLoading(true);
    try {
      const [usersRes, subHeardsRes, debatesRes] =
        await Promise.all([
          api.adminGetUsers(adminKey),
          api.adminGetSubHeards(adminKey),
          api.adminGetDebates(adminKey),
        ]);

      if (
        usersRes.success &&
        subHeardsRes.success &&
        debatesRes.success
      ) {
        setUsers(usersRes.data?.users || []);
        setSubHeards(subHeardsRes.data?.subHeards || []);
        setDebates(debatesRes.data?.debates || []);
        setIsAuthenticated(true);
      } else {
        alert(
          `Invalid admin key: ${usersRes.error || subHeardsRes.error || debatesRes.error || "Unknown error"}`,
        );
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      alert("Failed to authenticate");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleUpdateAdmin = async () => {
    if (!selectedSubHeard || !newAdminId) return;

    try {
      const res = await api.adminUpdateSubHeardAdmin(
        selectedSubHeard.name,
        newAdminId,
        adminKey,
      );

      if (res.success) {
        alert(
          `Admin updated successfully for ${selectedSubHeard.name}`,
        );
        setSelectedSubHeard(null);
        setNewAdminId("");
        fetchAdminData(); // Refresh data
      } else {
        alert(`Failed to update admin: ${res.error}`);
      }
    } catch (error) {
      console.error("Error updating admin:", error);
      alert("Failed to update admin");
    }
  };

  const getUserName = (userId?: string) => {
    if (!userId) return "No admin";
    const user = users.find((u) => u.userId === userId);
    return user ? user.name : userId.substring(0, 8);
  };

  const handleRename = async () => {
    if (!renameSubHeard || !newSubHeardName) return;

    try {
      const res = await api.adminRenameSubHeard(
        renameSubHeard.name,
        newSubHeardName,
        adminKey,
      );

      if (res.success) {
        alert(
          `Sub-heard renamed successfully!\n` +
            `Old name: ${res.data?.oldName}\n` +
            `New name: ${res.data?.newName}\n` +
            `Updated ${res.data?.updatedMemberships} memberships and ${res.data?.updatedRooms} rooms`,
        );
        setRenameSubHeard(null);
        setNewSubHeardName("");
        fetchAdminData(); // Refresh data
      } else {
        alert(`Failed to rename sub-heard: ${res.error}`);
      }
    } catch (error) {
      console.error("Error renaming sub-heard:", error);
      alert("Failed to rename sub-heard");
    }
  };

  const handleToggleDebateActive = async (debateId: string) => {
    setTogglingDebateId(debateId);
    try {
      const res = await api.adminToggleDebateActive(
        debateId,
        adminKey,
      );

      if (res.success) {
        // Update local state
        setDebates((prev) =>
          prev.map((d) =>
            d.id === debateId
              ? {
                  ...d,
                  isActive:
                    res.data?.debate?.isActive ?? !d.isActive,
                }
              : d,
          ),
        );
      } else {
        alert(`Failed to toggle debate status: ${res.error}`);
      }
    } catch (error) {
      console.error("Error toggling debate status:", error);
      alert("Failed to toggle debate status");
    } finally {
      setTogglingDebateId(null);
    }
  };

  const handleUpdateDebateSubHeard = async () => {
    if (!selectedDebate) return;

    try {
      const res = await api.adminUpdateDebateSubHeard(
        selectedDebate.id,
        newDebateSubHeard || null,
        adminKey,
      );

      if (res.success) {
        alert(`Community updated successfully for debate!`);
        // Update local state
        setDebates((prev) =>
          prev.map((d) =>
            d.id === selectedDebate.id
              ? { ...d, subHeard: res.data?.debate?.subHeard }
              : d,
          ),
        );
        setSelectedDebate(null);
        setNewDebateSubHeard("");
      } else {
        alert(`Failed to update community: ${res.error}`);
      }
    } catch (error) {
      console.error("Error updating debate community:", error);
      alert("Failed to update debate community");
    }
  };

  const handleDataFixNormalizeDupontCircle = async () => {
    if (
      !confirm(
        "Run data fix to normalize 'Dupont Circle Neighborhoods' to 'dupont-circle-neighborhoods'?",
      )
    ) {
      return;
    }

    setDataFixLoading("dupont-circle");
    try {
      const res =
        await api.adminDataFixNormalizeDupontCircle(adminKey);
      if (res.success) {
        alert(
          res.data?.message ||
            `Fixed ${res.data?.updatedRooms || 0} room(s)`,
        );
        // Refresh the debates list
        await fetchAdminData();
      } else {
        alert(`Failed to run data fix: ${res.error}`);
      }
    } catch (error) {
      console.error("Error running data fix:", error);
      alert("Failed to run data fix");
    } finally {
      setDataFixLoading(null);
    }
  };

  const handleFixActiveRoomPointers = async () => {
    if (
      !confirm(
        "Migrate active_room records from full JSON objects to room ID pointers?",
      )
    ) {
      return;
    }

    setDataFixLoading("active-room-pointers");
    try {
      const res = await api.request(
        "/one-time-fixes/fix-active-room-pointers",
        {
          method: "POST",
          headers: { "X-Admin-Key": adminKey },
        },
      );
      if (res.success) {
        alert(
          `Migrated ${res.data?.migrated || 0} record(s), skipped ${res.data?.skipped || 0} already-migrated record(s)`,
        );
        await fetchAdminData();
      } else {
        alert(`Failed to run migration: ${res.error}`);
      }
    } catch (error) {
      console.error("Error running migration:", error);
      alert("Failed to run migration");
    } finally {
      setDataFixLoading(null);
    }
  };

  const handleMigrateIsActiveToRooms = async () => {
    if (
      !confirm(
        "Migrate isActive field into room objects and delete all active_room lookup records? This is a one-time migration.",
      )
    ) {
      return;
    }

    setDataFixLoading("migrate-isactive");
    try {
      const res = await api.request(
        "/one-time-fixes/migrate-isactive-to-rooms",
        {
          method: "POST",
          headers: { "X-Admin-Key": adminKey },
        },
      );
      if (res.success) {
        alert(
          `Set ${res.data?.updated || 0} room(s) to active, ${res.data?.alreadyActive || 0} already active`,
        );
        await fetchAdminData();
      } else {
        alert(`Failed to run migration: ${res.error}`);
      }
    } catch (error) {
      console.error("Error running migration:", error);
      alert("Failed to run migration");
    } finally {
      setDataFixLoading(null);
    }
  };

  const handleBackfillUserCreatedAt = async () => {
    if (
      !confirm(
        "Backfill createdAt field for all users from database created_at column? Safe to run multiple times.",
      )
    ) {
      return;
    }

    setDataFixLoading("backfill-user-created-at");
    try {
      const res = await api.request(
        "/one-time-fixes/backfill-user-created-at",
        {
          method: "POST",
          headers: { "X-Admin-Key": adminKey },
        },
      );
      if (res.success) {
        alert(
          `Backfilled ${res.data?.updated || 0} user(s), skipped ${res.data?.skipped || 0} already-backfilled, ${res.data?.errors || 0} error(s)`,
        );
        await fetchAdminData();
      } else {
        alert(`Failed to run backfill: ${res.error}`);
      }
    } catch (error) {
      console.error("Error running backfill:", error);
      alert("Failed to run backfill");
    } finally {
      setDataFixLoading(null);
    }
  };

  const handleCreateRedditRoom = async () => {
    if (!redditUrl.trim()) {
      alert("Please enter a Reddit post URL");
      return;
    }

    // Use the first user as the room creator
    const userId = users[0]?.userId;
    if (!userId) {
      alert("No users found in the system");
      return;
    }

    setCreatingRedditRoom(true);
    try {
      const res = await api.adminCreateRedditSeedRoom(
        redditUrl,
        userId,
        adminKey,
        redditSubHeard || undefined,
      );

      if (res.success) {
        alert(
          `Success! Created room with:\n` +
            `Topic: ${res.data?.room?.topic}\n` +
            `Rants: ${res.data?.room?.rantCount}\n` +
            `Statements: ${res.data?.room?.statementCount}\n` +
            `Room ID: ${res.data?.room?.id}`,
        );
        setRedditUrl("");
        setRedditSubHeard("");
        // Refresh the debates list
        await fetchAdminData();
      } else {
        alert(`Failed to create Reddit room: ${res.error}`);
      }
    } catch (error) {
      console.error("Error creating Reddit room:", error);
      alert("Failed to create Reddit room");
    } finally {
      setCreatingRedditRoom(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl">Dev Admin Panel</h1>
            </div>
            {onExit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExit}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <form
            onSubmit={handleAuthenticate}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="adminKey">Admin Key</Label>
              <Input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter dev admin key"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Authenticate"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl">Dev Admin Panel</h1>
          </div>
          <div className="flex gap-2">
            {onExit && (
              <Button variant="outline" onClick={onExit}>
                <X className="w-4 h-4 mr-2" />
                Exit
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false);
                setAdminKey("");
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "subheards" ? "default" : "ghost"}
            onClick={() => setActiveTab("subheards")}
          >
            Communities
          </Button>
          <Button
            variant={activeTab === "debates" ? "default" : "ghost"}
            onClick={() => setActiveTab("debates")}
          >
            Debates
          </Button>
          <Button
            variant={activeTab === "tools" ? "default" : "ghost"}
            onClick={() => setActiveTab("tools")}
          >
            Dev Tools
          </Button>
          <Button
            variant={activeTab === "fixes" ? "default" : "ghost"}
            onClick={() => setActiveTab("fixes")}
          >
            Data Fixes
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            onClick={() => setActiveTab("users")}
          >
            Users
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            onClick={() => setActiveTab("history")}
          >
            <History className="w-4 h-4 mr-2" />
            User History
          </Button>
        </div>

        {activeTab === "subheards" && (
          <Card className="p-6">
            <h2 className="text-xl mb-4">Manage Sub-Heards</h2>
            <div className="space-y-4">
              {subHeards.map((subHeard) => (
                <div
                  key={subHeard.name}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {subHeard.name}
                      </span>
                      {subHeard.isPrivate && (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Crown className="w-3 h-3" />
                      <span>
                        Admin: {getUserName(subHeard.adminId)}
                      </span>
                    </div>
                    {subHeard.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        Created:{" "}
                        {new Date(
                          subHeard.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRenameSubHeard(subHeard);
                        setNewSubHeardName(subHeard.name);
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubHeard(subHeard);
                        setNewAdminId(subHeard.adminId || "");
                      }}
                    >
                      Change Admin
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "debates" && (
          <Card className="p-6">
            <h2 className="text-xl mb-4">All Debates</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {debates.map((debate) => (
                <div
                  key={debate.id}
                  className="border rounded-lg p-4 flex items-start justify-between"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {debate.topic}
                      </span>
                      {debate.isActive ? (
                        <Badge
                          variant="default"
                          className="bg-green-600"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Inactive
                        </Badge>
                      )}
                      {debate.rantFirst && (
                        <Badge
                          variant="outline"
                          className="text-purple-600 border-purple-600"
                        >
                          Rant First
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {debate.subHeard ? (
                        <div className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          <span>{debate.subHeard}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          <span className="italic">
                            No community
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>
                          {debate.participants.length}{" "}
                          participants
                        </span>
                      </div>
                      <div>
                        <span>Phase: {debate.phase}</span>
                      </div>
                      <div>
                        <span>Mode: {debate.mode}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        ID: {debate.id.substring(0, 12)}...
                      </span>
                      <span>•</span>
                      <span>
                        Created:{" "}
                        {new Date(
                          debate.createdAt,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDebate(debate);
                        setNewDebateSubHeard(
                          debate.subHeard || "",
                        );
                      }}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Change Community
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleDebateActive(debate.id)
                      }
                      disabled={togglingDebateId === debate.id}
                    >
                      {togglingDebateId === debate.id ? (
                        "..."
                      ) : debate.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              {debates.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No debates found
                </p>
              )}
            </div>
          </Card>
        )}

        {activeTab === "tools" && (
          <>
            <PolisImporter
              subHeards={subHeards}
              currentUserId={users[0]?.userId || ""}
              onImportComplete={fetchAdminData}
            />

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TestTube className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl">Dev Tools - Reddit Seed</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Create a test debate room from a Reddit post. The
                post title becomes the topic, and comments are
                processed into statements using AI.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="redditUrl">Reddit Post URL</Label>
                  <Input
                    id="redditUrl"
                    value={redditUrl}
                    onChange={(e) => setRedditUrl(e.target.value)}
                    placeholder="https://www.reddit.com/r/subreddit/comments/..."
                    disabled={creatingRedditRoom}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste a link to any Reddit post
                  </p>
                </div>
                <div>
                  <Label htmlFor="redditSubHeard">
                    Sub-Heard (Optional)
                  </Label>
                  <Select
                    value={redditSubHeard || "none"}
                    onValueChange={(value) =>
                      setRedditSubHeard(
                        value === "none" ? "" : value,
                      )
                    }
                    disabled={creatingRedditRoom}
                  >
                    <SelectTrigger id="redditSubHeard">
                      <SelectValue placeholder="None (public)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        None (public)
                      </SelectItem>
                      {subHeards.map((sh) => (
                        <SelectItem key={sh.name} value={sh.name}>
                          {sh.name} {sh.isPrivate ? "🔒" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateRedditRoom}
                  disabled={creatingRedditRoom || !redditUrl.trim()}
                  className="w-full"
                >
                  {creatingRedditRoom
                    ? "Creating Room..."
                    : "Create Test Room from Reddit"}
                </Button>
              </div>
            </Card>
          </>
        )}

        {activeTab === "fixes" && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl">One-Time Data Fixes</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Idempotent operations to fix database issues. Safe
              to run multiple times.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-purple-50">
                <div className="flex-1">
                  <h3 className="font-medium">
                    Set All Rooms to Active
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Recovery migration: Sets all rooms to
                    isActive=true. Run this to restore room
                    visibility after the active_room data was
                    lost.
                  </p>
                </div>
                <Button
                  onClick={handleMigrateIsActiveToRooms}
                  disabled={dataFixLoading === "migrate-isactive"}
                  variant="outline"
                  size="sm"
                >
                  {dataFixLoading === "migrate-isactive"
                    ? "Running..."
                    : "Set All Active"}
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">
                    Normalize Dupont Circle Sub-Heard
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Updates rooms with "Dupont Circle
                    Neighborhoods" to
                    "dupont-circle-neighborhoods"
                  </p>
                </div>
                <Button
                  onClick={handleDataFixNormalizeDupontCircle}
                  disabled={dataFixLoading === "dupont-circle"}
                  variant="outline"
                  size="sm"
                >
                  {dataFixLoading === "dupont-circle"
                    ? "Running..."
                    : "Run Fix"}
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 opacity-60">
                <div className="flex-1">
                  <h3 className="font-medium text-muted-foreground">
                    Fix Active Room Pointers (Obsolete)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Migrate active_room records from full JSON
                    objects to room ID pointers. This migration is
                    obsolete - use "Migrate isActive to Rooms"
                    instead.
                  </p>
                </div>
                <Button
                  onClick={handleFixActiveRoomPointers}
                  disabled={true}
                  variant="outline"
                  size="sm"
                >
                  Disabled
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                <div className="flex-1">
                  <h3 className="font-medium">
                    Backfill User CreatedAt
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Backfill createdAt field for all users from
                    database created_at column. Safe to run
                    multiple times.
                  </p>
                </div>
                <Button
                  onClick={handleBackfillUserCreatedAt}
                  disabled={
                    dataFixLoading === "backfill-user-created-at"
                  }
                  variant="outline"
                  size="sm"
                >
                  {dataFixLoading === "backfill-user-created-at"
                    ? "Running..."
                    : "Backfill CreatedAt"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "users" && (
          <Card className="p-6">
            <h2 className="text-xl mb-4">Recent Users</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.slice(0, 50).map((user) => (
                <div
                  key={user.userId}
                  className="border rounded p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.userId.substring(0, 12)}...
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.lastSeen).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Change Admin Dialog */}
      <Dialog
        open={!!selectedSubHeard}
        onOpenChange={() => setSelectedSubHeard(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Change Admin for {selectedSubHeard?.name}
            </DialogTitle>
            <DialogDescription>
              Select a new admin from the list of users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Admin</Label>
              <p className="text-sm text-muted-foreground">
                {getUserName(selectedSubHeard?.adminId)}
              </p>
            </div>
            <div>
              <Label htmlFor="newAdmin">New Admin</Label>
              <Select
                value={newAdminId}
                onValueChange={setNewAdminId}
              >
                <SelectTrigger id="newAdmin">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem
                      key={user.userId}
                      value={user.userId}
                    >
                      {user.name} ({user.userId.substring(0, 8)}
                      ...)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedSubHeard(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAdmin}
              disabled={!newAdminId}
            >
              Update Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Sub-Heard Dialog */}
      <Dialog
        open={!!renameSubHeard}
        onOpenChange={() => setRenameSubHeard(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Sub-Heard</DialogTitle>
            <DialogDescription>
              This will update the sub-heard name, all
              memberships, and all active rooms.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Name</Label>
              <p className="text-sm text-muted-foreground font-mono">
                {renameSubHeard?.name}
              </p>
            </div>
            <div>
              <Label htmlFor="newName">New Name</Label>
              <Input
                id="newName"
                value={newSubHeardName}
                onChange={(e) =>
                  setNewSubHeardName(e.target.value)
                }
                placeholder="Enter new sub-heard name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will be normalized to lowercase with hyphens
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameSubHeard(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={
                !newSubHeardName ||
                newSubHeardName === renameSubHeard?.name
              }
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Debate Community Dialog */}
      <Dialog
        open={!!selectedDebate}
        onOpenChange={() => setSelectedDebate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Change Community for Debate
            </DialogTitle>
            <DialogDescription>
              Move this debate to a different community or make
              it public
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Debate Topic</Label>
              <p className="text-sm text-muted-foreground">
                {selectedDebate?.topic}
              </p>
            </div>
            <div>
              <Label>Current Community</Label>
              <p className="text-sm text-muted-foreground font-mono">
                {selectedDebate?.subHeard ||
                  "(Public / No community)"}
              </p>
            </div>
            <div>
              <Label htmlFor="debateCommunity">
                New Community
              </Label>
              <Select
                value={newDebateSubHeard || "none"}
                onValueChange={setNewDebateSubHeard}
              >
                <SelectTrigger id="debateCommunity">
                  <SelectValue placeholder="Select community" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    None (Public)
                  </SelectItem>
                  {subHeards.map((sh) => (
                    <SelectItem key={sh.name} value={sh.name}>
                      {sh.name} {sh.isPrivate ? "🔒" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Select "None" to make the debate public
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedDebate(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateDebateSubHeard}>
              Update Community
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}