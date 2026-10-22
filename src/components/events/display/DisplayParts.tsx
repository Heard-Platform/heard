import type { ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { MonkeyAvatar } from "../../MonkeyAvatar";

export function DisplayBrand() {
  return (
    <div className="inline-flex items-center gap-[0.6cqw] text-[2.1cqw] font-extrabold leading-none tracking-tight">
      <MonkeyAvatar className="h-[2.8cqw] w-[2.8cqw]" />
      heard
    </div>
  );
}

interface DisplayQrProps {
  joinUrl: string;
  caption?: string;
  className: string;
}

export function DisplayQr({ joinUrl, caption, className }: DisplayQrProps) {
  return (
    <div className="flex flex-col items-center gap-[0.4cqw]">
      <div className={`normal-bg aspect-square rounded-[0.6cqw] p-[0.55cqw] ${className}`}>
        <QRCodeSVG value={joinUrl} className="block h-full w-full" />
      </div>
      {caption && <p className="text-center text-[0.95cqw] font-bold tracking-wide secondary-text">{caption}</p>}
    </div>
  );
}

export type DisplayChipTone = "attendee" | "split" | "paused";

const CHIP_CLASS_NAME_BY_TONE: Record<DisplayChipTone, string> = {
  attendee: "attendee-chip",
  split: "split-chip",
  paused: "attention-bg attention-text",
};

export function DisplayChip({ tone, children }: { tone: DisplayChipTone; children: ReactNode }) {
  return (
    <span
      className={`ml-[0.7cqw] inline-block shrink-0 whitespace-nowrap rounded-full px-[0.6cqw] py-[0.38cqw] align-[0.15em] text-[0.95cqw] font-bold uppercase leading-none tracking-wider ${CHIP_CLASS_NAME_BY_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function DisplayEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[1.15cqw] font-bold uppercase tracking-[0.12em] secondary-text">{children}</p>;
}

export function DisplayCenteredScreen({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6cqw] p-[4cqw] text-center">
      {children}
      <div className="absolute right-[3.6cqw] bottom-[2.4cqw]">
        <DisplayBrand />
      </div>
    </div>
  );
}
