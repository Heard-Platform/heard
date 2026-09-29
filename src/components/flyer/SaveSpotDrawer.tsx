import { useState, type FormEvent } from "react";
import { ArrowRight, Lock, Rainbow, type LucideIcon } from "lucide-react";
import { getClusterDisplayName } from "../../utils/colors";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "../ui/drawer";
import { slotTextColorOnLight, type MinimapCluster } from "../room/ClusterMinimap";

interface SaveSpotDrawerProps {
  isOpen: boolean;
  tribe: MinimapCluster;
  onOpenChange: (isOpen: boolean) => void;
  onSendCode: (email: string) => void;
}

const NOTIFY_REASONS: { icon: LucideIcon; text: string }[] = [
  { icon: ArrowRight, text: "Your group shifts" },
  { icon: Rainbow, text: "A new bridge shows up" },
  { icon: Lock, text: "The results lock in" },
];

export function SaveSpotDrawer({ isOpen, tribe, onOpenChange, onSendCode }: SaveSpotDrawerProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSendCode(email.trim());
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-3xl border-none bg-[#F2EEE3]">
        <div className="px-5 pb-6 pt-5">
          <div className="flex items-center gap-2.5">
            <TribeIcon />
            <span
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: slotTextColorOnLight(tribe.slot) }}
            >
              {getClusterDisplayName(tribe.slot, tribe.name)}
            </span>
          </div>

          <DrawerTitle className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-[#1C1B1F]">
            Your spot is yours now.
          </DrawerTitle>
          <DrawerDescription className="mt-1 text-base text-[#4A463F]">
            Where should we send word when it moves?
          </DrawerDescription>

          <ul className="mt-4 flex flex-col gap-2.5">
            {NOTIFY_REASONS.map(({ icon, text }) => (
              <NotifyReason key={text} icon={icon} text={text} />
            ))}
          </ul>

          <p className="mt-5 text-center text-xs text-[#6B6760]">We'll email you a code</p>
          <form className="mt-2 flex gap-2" onSubmit={handleSubmit}>
            <input
              className="min-w-0 flex-1 rounded-xl border border-[#E3DDD1] bg-white px-4 py-3 text-base text-[#1C1B1F] outline-none placeholder:text-[#A8A298] focus:border-[#1c1a2b]"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button
              className="shrink-0 rounded-xl px-4 py-3 text-base font-bold text-white"
              style={{ backgroundColor: "#E4603C" }}
              type="submit"
            >
              Send code
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-[#6B6760]">No password. No spam. Just your spot.</p>

          <button
            className="mt-4 w-full py-2 text-sm font-semibold text-[#4A463F]"
            onClick={() => onOpenChange(false)}
          >
            Not now
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function TribeIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "#1c1a2b" }}>
      <div
        className="h-3.5 w-3.5 rounded-full"
        style={{ backgroundColor: "#f97316", border: "2px solid white", boxShadow: "0 0 0 3px #f9731655" }}
      />
    </div>
  );
}

function NotifyReason({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8E3D6]">
        <Icon className="h-4 w-4 text-[#1C1B1F]" />
      </div>
      <span className="text-sm font-semibold text-[#1C1B1F]">{text}</span>
    </li>
  );
}
