import { MonkeyAvatar } from "./MonkeyAvatar";

export function HeardWordmark() {
  return (
    <div className="flex items-center gap-2">
      <MonkeyAvatar className="h-8 w-8" />
      <span className="text-[28px] font-extrabold leading-none tracking-tight text-[#1C1B1F]">heard</span>
    </div>
  );
}
