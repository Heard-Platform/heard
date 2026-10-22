import type { ReactNode } from "react";
import { HeardWordmark } from "../../HeardWordmark";
import { MonkeyAvatar } from "../../MonkeyAvatar";

export function AttendeeFrame({ children }: { children: ReactNode }) {
  return (
    <div className="heard-feed-bg relative flex min-h-full flex-1 flex-col overflow-clip px-5 pt-4 pb-5">
      <div className="flex h-10 items-center">
        <HeardWordmark />
      </div>
      {children}
    </div>
  );
}

interface AttendeeMessageProps {
  title: string;
  body?: string;
  chip?: string;
}

export function AttendeeMessage({ title, body, chip }: AttendeeMessageProps) {
  return (
    <div className="text-center">
      <MonkeyAvatar className="mx-auto mb-4 h-20 w-20" />
      <p className="text-3xl font-extrabold tracking-tight text-foreground">{title}</p>
      {chip && (
        <p className="mx-auto mt-3 w-fit heard-primary-gradient rounded-full px-3 py-1 text-sm font-semibold text-white tabular-nums">
          {chip}
        </p>
      )}
      {body && <p className="mx-auto mt-3 max-w-72 text-base leading-snug secondary-text">{body}</p>}
    </div>
  );
}
