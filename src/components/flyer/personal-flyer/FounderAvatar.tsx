import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import profilePhoto from "../../../assets/profile.jpeg";
import { COLORS, FOUNDER_NAME } from "./personal-flyer-theme";

export function FounderAvatar({ sizePx }: { sizePx: number }) {
  return (
    <Avatar
      className="border-[3px] border-white shadow-[0_4px_16px_rgba(30,35,64,0.15)]"
      style={{ width: sizePx, height: sizePx }}
    >
      <AvatarImage src={profilePhoto} alt={FOUNDER_NAME} className="object-cover" />
      <AvatarFallback
        className="text-3xl font-extrabold text-white"
        style={{ backgroundColor: COLORS.ink }}
      >
        {FOUNDER_NAME[0]}
      </AvatarFallback>
    </Avatar>
  );
}
