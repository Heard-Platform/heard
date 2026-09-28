import type { ReactNode } from "react";
import { House, Search } from "lucide-react";
import type { UserSession } from "../types";
import { RantLabel } from "./RantLabel";
import { UserAvatar } from "./side-panel/UserAvatar";

export type BottomNavTab = "home" | "explore" | "new" | "profile";

interface BottomNavProps {
  user: UserSession;
  onSelectTab: (tab: BottomNavTab) => void;
}

interface NavButtonProps {
  label: string;
  children: ReactNode;
  onClick: () => void;
}

function NavButton({ label, children, onClick }: NavButtonProps) {
  return (
    <button
      aria-label={label}
      className="flex h-full flex-1 items-center justify-center"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function BottomNav({ user, onSelectTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 controls-layer border-t border-gray-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      <div className="mx-auto flex h-(--nav-bottom-height) max-w-2xl items-center justify-around">
        <NavButton label="Home" onClick={() => onSelectTab("home")}>
          <House className="h-7 w-7 text-gray-700" strokeWidth={1.75} />
        </NavButton>

        <NavButton label="Explore" onClick={() => onSelectTab("explore")}>
          <Search className="h-7 w-7 text-gray-700" strokeWidth={1.75} />
        </NavButton>

        <NavButton label="New" onClick={() => onSelectTab("new")}>
          <RantLabel />
        </NavButton>

        <NavButton label="Profile" onClick={() => onSelectTab("profile")}>
          <UserAvatar user={user} />
        </NavButton>
      </div>
    </nav>
  );
}
