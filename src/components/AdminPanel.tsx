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
import { Shield, Lock, User, Crown, X } from "lucide-react";
import { API_BASE_URL } from "../utils/api";
import { publicAnonKey } from "../utils/supabase/info";

interface User {
  userId: string;
  name: string;
  lastSeen: number;
}

interface SubHeard {
  name: string;
  createdAt: number;
  isPrivate: boolean;
  adminId?: string;
}

interface AdminPanelProps {
  onExit?: () => void;
}

export function AdminPanel({ onExit }: AdminPanelProps) {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [subHeards, setSubHeards] = useState<SubHeard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubHeard, setSelectedSubHeard] = useState<SubHeard | null>(null);
  const [newAdminId, setNewAdminId] = useState("");

  const fetchAdminData = async () => {
    if (!adminKey) return;

    setLoading(true);
    try {
      const [usersRes, subHeardsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, {
          headers: {
            "Authorization": `Bearer ${publicAnonKey}`,
            "X-Admin-Key": adminKey,
          },
        }),
        fetch(`${API_BASE_URL}/admin/subheards`, {
          headers: {
            "Authorization": `Bearer ${publicAnonKey}`,
            "X-Admin-Key": adminKey,
          },
        }),
      ]);

      if (usersRes.ok && subHeardsRes.ok) {
        const usersData = await usersRes.json();
        const subHeardsData = await subHeardsRes.json();
        setUsers(usersData.users || []);
        setSubHeards(subHeardsData.subHeards || []);
        setIsAuthenticated(true);
      } else {
        const usersError = !usersRes.ok ? await usersRes.json() : null;
        const subHeardsError = !subHeardsRes.ok ? await subHeardsRes.json() : null;
        alert(`Invalid admin key: ${usersError?.error || subHeardsError?.error || "Unknown error"}`);
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
      const res = await fetch(
        `${API_BASE_URL}/admin/subheard/${selectedSubHeard.name}/admin`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${publicAnonKey}`,
            "X-Admin-Key": adminKey,
          },
          body: JSON.stringify({ newAdminId }),
        }
      );

      if (res.ok) {
        alert(`Admin updated successfully for ${selectedSubHeard.name}`);
        setSelectedSubHeard(null);
        setNewAdminId("");
        fetchAdminData(); // Refresh data
      } else {
        const error = await res.json();
        alert(`Failed to update admin: ${error.error}`);
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
          <form onSubmit={handleAuthenticate} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={loading}>
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
              <Button
                variant="outline"
                onClick={onExit}
              >
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl">{users.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sub-Heards</p>
                <p className="text-2xl">{subHeards.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sub-Heards Management */}
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
                    <span className="font-medium">{subHeard.name}</span>
                    {subHeard.isPrivate && (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Crown className="w-3 h-3" />
                    <span>Admin: {getUserName(subHeard.adminId)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(subHeard.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
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

        {/* Users List */}
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
      </div>

      {/* Change Admin Dialog */}
      <Dialog open={!!selectedSubHeard} onOpenChange={() => setSelectedSubHeard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Admin for {selectedSubHeard?.name}</DialogTitle>
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
              <Select value={newAdminId} onValueChange={setNewAdminId}>
                <SelectTrigger id="newAdmin">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.userId} value={user.userId}>
                      {user.name} ({user.userId.substring(0, 8)}...)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubHeard(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin} disabled={!newAdminId}>
              Update Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
