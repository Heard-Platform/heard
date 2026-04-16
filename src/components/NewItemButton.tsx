import { useState } from "react";
import { SquarePlus, MessageSquare, Calendar, ChevronDown, type LucideIcon } from "lucide-react";

interface NewItemButtonProps {
  onNewConversation: () => void;
  onNewEvent: () => void;
}

interface MenuItem {
  label: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
  hoverClass: string;
  onClick: () => void;
}

function MenuItemButton({ label, description, icon: Icon, iconClass, bgClass, hoverClass, onClick }: MenuItem) {
  return (
    <button
      className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium text-gray-800 ${hoverClass} transition-colors`}
      onClick={onClick}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${bgClass} shrink-0`}>
        <Icon className={`w-4 h-4 ${iconClass}`} />
      </div>
      <div className="text-left">
        <div className="text-gray-800">{label}</div>
        <div className="text-xs text-gray-400 font-normal">{description}</div>
      </div>
    </button>
  );
}

export function NewItemButton({ onNewConversation, onNewEvent }: NewItemButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const items: MenuItem[] = [
    {
      label: "Conversation",
      description: "Start a discussion",
      icon: MessageSquare,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-100",
      hoverClass: "hover:bg-emerald-50",
      onClick: () => { setMenuOpen(false); onNewConversation(); },
    },
    {
      label: "Event",
      description: "Organize multiple conversations",
      icon: Calendar,
      iconClass: "text-orange-500",
      bgClass: "bg-orange-100",
      hoverClass: "hover:bg-orange-50",
      onClick: () => { setMenuOpen(false); onNewEvent(); },
    },
  ];

  return (
    <div className="relative">
      <button
        style={{ height: 30 }}
        className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 px-3 controls-layer"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <SquarePlus className="w-4 h-4 text-gray-600 shrink-0" />
        <span className="text-gray-700 text-sm font-medium">New</span>
        <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 w-52 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden p-1.5 flex flex-col gap-1">
            {items.map((item) => (
              <MenuItemButton key={item.label} {...item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
