import { User, ShieldAlert, ShieldCheck } from "lucide-react";
import type { UserSession } from "../../types";
import { AvatarAlertDot } from "./AvatarAlertDot";

interface UserAvatarProps {
  user: UserSession;
}

export function UserAvatar({ user }: UserAvatarProps) {
  return (
    <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
      <User className="w-4 h-4 text-white" />
      {!user.phoneVerified && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center">
          <ShieldAlert className="w-2 h-2 text-white" />
        </div>
      )}
      {user.phoneVerified && (
        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
          <ShieldCheck className="w-2 h-2 text-white" />
        </div>
      )}
      <AvatarAlertDot />
    </div>
  );
}
