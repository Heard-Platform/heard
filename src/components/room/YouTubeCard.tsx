interface YouTubeCardProps {
  url: string;
  isTopCard: boolean;
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function YouTubeCard({ url, isTopCard }: YouTubeCardProps) {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-red-600 font-medium">Invalid YouTube URL</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📺</span>
          <span className="text-sm text-purple-700 font-medium">Intro Video</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative w-full overflow-hidden rounded-2xl h-[200px]">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      {isTopCard && (
        <div className="pt-2 border-t border-purple-200">
          <p className="text-xs text-center text-purple-700">
            Swipe here to continue
          </p>
        </div>
      )}
    </>
  );
}