import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { UserSession } from "../../types";

interface UsersTableProps {
  users: UserSession[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl mb-4">All Users</h2>
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
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
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
                  {user.isTestUser ? (
                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                      Test
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No users found
          </p>
        )}
      </div>
    </Card>
  );
}
