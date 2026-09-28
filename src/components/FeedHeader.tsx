import type { ReactNode } from "react";

export const FEED_HEADER_HEIGHT_PX = 56;

interface FeedHeaderProps {
  hidden: boolean;
  communityPicker: ReactNode;
  onWordmarkClick: () => void;
}

export function FeedHeader({ hidden, communityPicker, onWordmarkClick }: FeedHeaderProps) {
  return (
    <header
      className="absolute top-0 left-0 right-0 controls-layer bg-(--app-bg) px-4 transition-transform duration-300 ease-out"
      style={{
        height: FEED_HEADER_HEIGHT_PX,
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <div className="mx-auto flex h-full max-w-2xl items-center justify-between gap-3">
        <button
          className="text-[28px] font-extrabold leading-none tracking-tight text-[#1C1B1F]"
          onClick={onWordmarkClick}
        >
          heard
        </button>
        <div className="min-w-0">{communityPicker}</div>
      </div>
    </header>
  );
}
