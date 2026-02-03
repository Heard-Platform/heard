import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import type { UserSession } from "../../types";
import { useState } from "react";
import { Phone } from "lucide-react";

interface UsersTableProps {
  users: UserSession[];
  adminKey: string;
  onClearPhoneVerification: (userId: string) => void;
  onUserUpdate: (userId: string, isTestUser: boolean) => void;
  onUserUnsubUpdate: (userId: string, isUnsubbedFromUpdates: boolean) => void;
}

export function UsersTable({
  users,
  adminKey,
  onClearPhoneVerification,
  onUserUpdate,
  onUserUnsubUpdate,
}: UsersTableProps) {
  const [hideTestUsers, setHideTestUsers] = useState(false);
  const [hideAnonUsers, setHideAnonUsers] = useState(false);

  const filteredUsers = users.filter(user => {
    if (hideTestUsers && user.isTestUser) return false;
    if (hideAnonUsers && user.isAnonymous) return false;
    return true;
  });

  return (
    <Card className="p-6">
      <div className="heard-between mb-4">
        <h2 className="text-xl">All Users ({filteredUsers.length})</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="hide-test-users"
              checked={hideTestUsers}
              onCheckedChange={(checked: boolean) => setHideTestUsers(checked)}
            />
            <Label htmlFor="hide-test-users" className="cursor-pointer">
              Hide test users
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox 
              id="hide-anon-users"
              checked={hideAnonUsers}
              onCheckedChange={(checked: boolean) => setHideAnonUsers(checked)}
            />
            <Label htmlFor="hide-anon-users" className="cursor-pointer">
              Hide anon users
            </Label>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Nickname</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">ID</th>
              <th className="text-left p-3 font-medium">Created At</th>
              <th className="text-center p-3 font-medium">Anonymous</th>
              <th className="text-center p-3 font-medium">Test User</th>
              <th className="text-center p-3 font-medium">Unsubbed from Updates</th>
              <th className="text-center p-3 font-medium">Clear Phone Verification</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-muted/30">
                <td className="p-3">{user.nickname}</td>
                <td className="p-3 text-sm">{user.email}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {user.id.substring(0, 12)}...
                </td>
                <td className="p-3 text-sm">
                  {user.createdAt 
                    ? new Date(user.createdAt).toLocaleString()
                    : "N/A"}
                </td>
                <td className="p-3 text-center">
                  {user.isAnonymous ? (
                    <Badge variant="secondary">Anon</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <Checkbox
                    checked={user.isTestUser || false}
                    onCheckedChange={(checked: boolean) => onUserUpdate(user.id, checked)}
                  />
                </td>
                <td className="p-3 text-center">
                  <Checkbox
                    checked={user.isUnsubbedFromUpdates || false}
                    onCheckedChange={(checked: boolean) => onUserUnsubUpdate(user.id, checked)}
                  />
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {user.phoneVerified ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onClearPhoneVerification(user.id)}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No users found
          </p>
        )}
      </div>
    </Card>
  );
}