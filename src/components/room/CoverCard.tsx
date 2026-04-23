interface CoverCardProps {
  coverType: "youtube" | "image";
  url: string;
  description?: string;
  isTopCard: boolean;
}

function extractYouTubeVideoId(url: string): string | null {
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

export function CoverCard({ coverType, url, description, isTopCard }: CoverCardProps) {
  const isYouTube = coverType === "youtube";

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
      <div className="relative w-full overflow-hidden rounded-2xl">
        <img
          src={url}
          alt="Room cover"
          className="w-full object-cover max-h-[220px]"
        />
      </div>
    );
  };

  return (
    <>
      <div className="heard-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-l">{icon}</span>
          <span className={`text-sm text-${accentColor}-700 font-medium`}>{label}</span>
        </div>
      </div>

      <div className="mb-4">{renderMedia()}</div>

      {description && (
        <p className="text-sm text-foreground/80 mb-2">{description}</p>
      )}

      {isTopCard && (
        <div className={`pt-2 border-t border-${accentColor}-200`}>
          <p className={`text-xs text-center text-${accentColor}-700`}>
            Swipe here to continue
          </p>
        </div>
      )}
    </>
  );
}
