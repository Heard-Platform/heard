import { motion } from "motion/react";
import { FullCoverData } from "../../types";
import { openImageOverlay } from "../../utils/image-overlay";

interface CoverCardProps {
  cover: FullCoverData;
  isTopCard: boolean;
}

// NOTE: Duplicated on backend
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function CoverCard({ cover, isTopCard }: CoverCardProps) {
  const { type, url, description } = cover;
  const isYouTube = type === "youtube";

  const label = isYouTube ? "Intro Video" : "Cover Image";
  const icon = isYouTube ? "📺" : "🖼️";
  const accentColor = isYouTube ? "purple" : "indigo";
  
  const renderMedia = () => {
    if (isYouTube) {
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        return (
          <div className="min-h-[200px] flex items-center justify-center">
            <p className="text-red-600 font-medium">Invalid YouTube URL</p>
          </div>
        );
      }
      return (
        <div className="relative w-full overflow-hidden rounded-2xl h-[200px]">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <motion.div
        className="relative w-full overflow-hidden rounded-2xl h-[200px] cursor-pointer"
        onTap={() => openImageOverlay(url)}
      >
        <img
          src={url}
          alt="Room cover"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
      </motion.div>
    );
  };

  return (
    <>
      {isYouTube && (
        <div className="heard-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-l">{icon}</span>
            <span className={`text-sm text-${accentColor}-700 font-medium`}>{label}</span>
          </div>
        </div>
      )}

      <div className="mb-4">{renderMedia()}</div>

      {isTopCard && (
        <div className={`pt-2 border-t border-${accentColor}-200`}>
          <p className={`text-xs text-center text-${accentColor}-700`}>
            Swipe this card away to begin voting
          </p>
        </div>
      )}
    </>
  );
}
