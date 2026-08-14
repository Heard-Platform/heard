import type { CSSProperties } from "react";
import { extractYouTubeVideoId } from "./room/CoverCard";
import { useYouTubeTitle } from "../hooks/useYouTubeTitle";

interface RenderedStatementProps {
  text: string;
}

const linkStyle: CSSProperties = {
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

export function RenderedStatement({ text }: RenderedStatementProps) {
  const videoId = extractYouTubeVideoId(text);
  const title = useYouTubeTitle(videoId);

  if (!videoId) {
    return <>{text}</>;
  }

  return (
    <a
      href={text}
      target="_blank"
      rel="noopener noreferrer"
      style={linkStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {title ?? text}
    </a>
  );
}
