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

import { useState, useEffect } from "react";
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
  History,
  Mail,
  MessageSquare,
} from "lucide-react";
import { api } from "../utils/api";
import { adminApi } from "../utils/admin-api";
import type { DebateRoom, SubHeard, UserSession } from "../types";
import { PolisImporter } from "./PolisImporter";
import { UserHistory } from "./admin/UserHistory";
import { UsersTable } from "./admin/UsersTable";
import { DataFixes } from "./admin/DataFixes";
import { Newsletter } from "./admin/Newsletter";
import { SmsNotifications } from "./admin/SmsNotifications";
import { safelyGetStorageItem, safelySetStorageItem } from "../utils/localStorage";

interface AdminPanelProps {
  onExit?: () => void;
}

export function AdminPanel({ onExit }: AdminPanelProps) {
  const [adminKey, setAdminKey] =
    useState(safelyGetStorageItem<string>("devAdminKey", ""));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<UserSession[]>([]);
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
  const [redditUrl, setRedditUrl] = useState("");
  const [redditSubHeard, setRedditSubHeard] = useState("");
  const [creatingRedditRoom, setCreatingRedditRoom] =
    useState(false);
  const [selectedDebate, setSelectedDebate] =
    useState<DebateRoom | null>(null);
  const [newDebateSubHeard, setNewDebateSubHeard] =
    useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === "undefined") return "subheards";
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");
    return tab || "subheards";
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
  };

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
        safelySetStorageItem("devAdminKey", adminKey);
      } else {
        alert(
          `Invalid admin key: ${usersRes.error || subHeardsRes.error || debatesRes.error || "Unknown error"}`,
        );
        setIsAuthenticated(false);
        localStorage.removeItem("devAdminKey");
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      alert("Failed to authenticate");
      setIsAuthenticated(false);
      localStorage.removeItem("devAdminKey");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey && !isAuthenticated) {
      fetchAdminData();
    }
  }, []);

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
    const user = users.find((u) => u.id === userId);
    return user ? user.nickname : userId.substring(0, 8);
  };

  const handleRename = async () => {
    if (!renameSubHeard || !newSubHeardName) return;

    try {
      const res = await api.adminRenameSubHeard(
        renameSubHeard.name,
        newSubHeardName,
        adminKey,
      ) as any;

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
        alert(`Failed to toggle post status: ${res.error}`);
      }
    } catch (error) {
      console.error("Error toggling post status:", error);
      alert("Failed to toggle post status");
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
        alert(`Community updated successfully for post!`);
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
      console.error("Error updating post community:", error);
      alert("Failed to update post community");
    }
  };

  const handleUpdateUserTestStatus = async (userId: string, isTestUser: boolean) => {
    try {
      const res = await api.adminUpdateUserTestStatus(userId, isTestUser, adminKey);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isTestUser } : u
          )
        );
      } else {
        alert(`Failed to update test user status: ${res.error}`);
      }
    } catch (error) {
      console.error("Error updating test user status:", error);
      alert("Failed to update test user status");
    }
  };

  const handleUpdateUserUnsubStatus = async (userId: string, isUnsubbedFromUpdates: boolean) => {
    try {
      const res = await api.adminUpdateUserUnsubStatus(userId, isUnsubbedFromUpdates, adminKey);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isUnsubbedFromUpdates } : u
          )
        );
      } else {
        alert(`Failed to update user unsub status: ${res.error}`);
      }
    } catch (error) {
      console.error("Error updating user unsub status:", error);
      alert("Failed to update user unsub status");
    }
  };

  const handleClearPhoneVerification = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to clear phone verification for ${user.nickname}?\n\n` +
      `This will:\n` +
      `- Delete the user_phone KV record\n` +
      `- Reset phoneNumber to null\n` +
      `- Reset isPhoneVerified to false\n` +
      `- Reset phoneVerifiedAt to null\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const res = await adminApi.clearPhoneVerification(adminKey, userId);
      if (res.success) {
        fetchAdminData();
        alert("Phone verification data cleared successfully");
      } else {
        alert(`Failed to clear phone verification: ${res.error}`);
      }
    } catch (error) {
      console.error("Error clearing phone verification:", error);
      alert("Failed to clear phone verification");
    }
  };

  const handleCreateRedditRoom = async () => {
    if (!redditUrl.trim()) {
      alert("Please enter a Reddit post URL");
      return;
    }

    const userId = users[0]?.id;
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
      ) as any;

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
      <div className="heard-page-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="heard-between mb-6">
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
    <div className="heard-page-bg p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="heard-between">
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
                localStorage.removeItem("devAdminKey");
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "subheards" ? "default" : "ghost"}
            onClick={() => handleTabChange("subheards")}
          >
            Communities
          </Button>
          <Button
            variant={activeTab === "debates" ? "default" : "ghost"}
            onClick={() => handleTabChange("debates")}
          >
            Debates
          </Button>
          <Button
            variant={activeTab === "newsletter" ? "default" : "ghost"}
            onClick={() => handleTabChange("newsletter")}
          >
            <Mail className="w-4 h-4 mr-2" />
            Newsletter
          </Button>
          <Button
            variant={activeTab === "tools" ? "default" : "ghost"}
            onClick={() => handleTabChange("tools")}
          >
            Dev Tools
          </Button>
          <Button
            variant={activeTab === "fixes" ? "default" : "ghost"}
            onClick={() => handleTabChange("fixes")}
          >
            Data Fixes
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            onClick={() => handleTabChange("users")}
          >
            Users
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            onClick={() => handleTabChange("history")}
          >
            <History className="w-4 h-4 mr-2" />
            User History
          </Button>
          <Button
            variant={activeTab === "sms" ? "default" : "ghost"}
            onClick={() => handleTabChange("sms")}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS Notifications
          </Button>
        </div>

        {activeTab === "subheards" && (
          <Card className="p-6">
            <h2 className="text-xl mb-4">Manage Sub-Heards</h2>
            <div className="space-y-4">
              {subHeards.map((subHeard) => (
                <div
                  key={subHeard.name}
                  className="border rounded-lg p-4 heard-between"
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
              currentUserId={users[0]?.id || ""}
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
                    onValueChange={(value: string) =>
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
          <DataFixes
            adminKey={adminKey}
            fetchAdminData={fetchAdminData}
          />
        )}

        {activeTab === "users" && (
          <UsersTable 
            users={users} 
            adminKey={adminKey}
            onUserUpdate={handleUpdateUserTestStatus}
            onUserUnsubUpdate={handleUpdateUserUnsubStatus}
            onClearPhoneVerification={handleClearPhoneVerification}
          />
        )}

        {activeTab === "history" && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl">User History</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              View detailed history of user actions and
              interactions.
            </p>
            <UserHistory
              currentUserId={users[0]?.id || ""}
              adminKey={adminKey}
            />
          </Card>
        )}

        {activeTab === "newsletter" && (
          <Newsletter
            adminKey={adminKey}
          />
        )}

        {activeTab === "sms" && (
          <SmsNotifications
            adminKey={adminKey}
            currentUserId={users[0]?.id || ""}
            debates={debates}
          />
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
                      key={user.id}
                      value={user.id}
                    >
                      {user.nickname} ({user.id.substring(0, 8)}
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