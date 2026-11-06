import { REPORT_NAVIGATION_LINKS } from "./report-sections";
import { ShareButton } from "./ShareButton";
import "./report.css";

interface NavigationProps {
  eventName: string;
}

export function Navigation({ eventName }: NavigationProps) {
  return (
    <nav className="normal-bg sticky top-0 z-10 border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-2.5">
        <span className="text-lg font-extrabold tracking-tight">
          heard
        </span>
        <span className="min-w-0 flex-1 truncate text-sm secondary-text">
          {eventName}
        </span>
        <div className="flex flex-wrap gap-1">
          {REPORT_NAVIGATION_LINKS.map((navigationLink) => (
            <a
              key={navigationLink.sectionId}
              href={`#${navigationLink.sectionId}`}
              className="rounded-full px-3 py-2 text-sm hover:underline"
            >
              {navigationLink.label}
            </a>
          ))}
        </div>
        <ShareButton variant="default" className="h-10" />
      </div>
    </nav>
  );
}