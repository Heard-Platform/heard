import type { AvatarAnimal } from "../../utils/constants/avatars";

export type RoomStatus = "needs_input" | "caught_up";

export interface EventRoom {
  id: string;
  topic: string;
  emoji: string;
  status: RoomStatus;
  userHasVoted: boolean;
  newStatementCount?: number;
  onCtaClick?: () => void;
  participantCount: number;
  totalMembers: number;
  participantAvatars: AvatarAnimal[];
}

export interface EventRoomListingProps {
  eventName: string;
  eventSubtitle?: string;
  totalMembers: number;
  rooms: EventRoom[];
}

export type ThemeConfig = {
  iconGradient: string;
  cardBg: string;
  border: string;
  pillBg: string;
  pillText: string;
  avatarRing: string;
};

const COLOR_CYCLE = ["yellow", "orange", "purple", "blue", "green", "pink", "teal"] as const;

export const THEME: Record<typeof COLOR_CYCLE[number], ThemeConfig> = {
  yellow: { iconGradient: "from-yellow-400 to-orange-400", cardBg: "from-yellow-50 via-white to-orange-50", border: "border-yellow-200", pillBg: "bg-yellow-100", pillText: "text-yellow-700", avatarRing: "ring-yellow-200" },
  orange: { iconGradient: "from-orange-400 to-rose-400", cardBg: "from-orange-50 via-white to-rose-50", border: "border-orange-200", pillBg: "bg-orange-100", pillText: "text-orange-700", avatarRing: "ring-orange-200" },
  purple: { iconGradient: "from-purple-500 to-blue-500", cardBg: "from-purple-50 via-white to-blue-50", border: "border-purple-200", pillBg: "bg-purple-100", pillText: "text-purple-700", avatarRing: "ring-purple-200" },
  blue: { iconGradient: "from-blue-400 to-cyan-400", cardBg: "from-blue-50 via-white to-cyan-50", border: "border-blue-200", pillBg: "bg-blue-100", pillText: "text-blue-700", avatarRing: "ring-blue-200" },
  green: { iconGradient: "from-green-400 to-emerald-500", cardBg: "from-green-50 via-white to-emerald-50", border: "border-green-200", pillBg: "bg-green-100", pillText: "text-green-700", avatarRing: "ring-green-200" },
  pink: { iconGradient: "from-pink-400 to-fuchsia-500", cardBg: "from-pink-50 via-white to-fuchsia-50", border: "border-pink-200", pillBg: "bg-pink-100", pillText: "text-pink-700", avatarRing: "ring-pink-200" },
  teal: { iconGradient: "from-teal-400 to-blue-400", cardBg: "from-teal-50 via-white to-blue-50", border: "border-teal-200", pillBg: "bg-teal-100", pillText: "text-teal-700", avatarRing: "ring-teal-200" },
};

export const AVATAR_EMOJIS: Record<AvatarAnimal, string> = {
  monkey: "🐒", koala: "🐨", rhino: "🦏", elephant: "🐘", sloth: "🦥", panda: "🐼",
};

export function themeForIndex(index: number): ThemeConfig {
  return THEME[COLOR_CYCLE[index % COLOR_CYCLE.length]];
}