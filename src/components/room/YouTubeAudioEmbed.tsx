import { useEffect, useRef, useState } from "react";
import { Play, Pause, Rewind, FastForward, Eye, EyeOff } from "lucide-react";
import { extractYouTubeVideoId } from "./CoverCard";
import { useShowVideoSetting } from "../../hooks/useShowVideoSetting";

const SKIP_SECONDS = 10;

interface YouTubeAudioEmbedProps {
  url: string;
  isPlaying: boolean;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeIframeApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function YouTubeAudioEmbed({ url, isPlaying }: YouTubeAudioEmbedProps) {
  const videoId = extractYouTubeVideoId(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState("");
  const [showVideo, toggleShowVideo] = useShowVideoSetting();

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { controls: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (event: any) => {
            setTitle(event.target.getVideoData?.()?.title || "");
          },
          onStateChange: (event: any) => {
            setPlaying(event.data === window.YT.PlayerState.PLAYING);
            setTitle(event.target.getVideoData?.()?.title || "");
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
    };
  }, [videoId]);

  // Browsers block unmuted iframe autoplay without a direct user gesture on
  // that frame, so a card becoming active can't force playback — only stop it.
  useEffect(() => {
    if (!isPlaying) {
      playerRef.current?.pauseVideo?.();
    }
  }, [isPlaying]);

  if (!videoId) {
    return (
      <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#dc2626", fontWeight: 600 }}>Invalid YouTube link</p>
      </div>
    );
  }

  const togglePlayback = () => {
    if (playing) {
      playerRef.current?.pauseVideo?.();
    } else {
      playerRef.current?.playVideo?.();
    }
  };

  const skip = (deltaSeconds: number) => {
    const player = playerRef.current;
    if (!player?.getCurrentTime) return;
    const current = player.getCurrentTime();
    const duration = player.getDuration?.() || Infinity;
    const target = Math.min(Math.max(current + deltaSeconds, 0), duration);
    player.seekTo(target, true);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 200,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        className="yt-audio-embed-frame"
        style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
      >
        <div ref={containerRef} />
      </div>

      {/* Custom control surface, opaque when hiding the video, a bottom scrim otherwise. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: showVideo
            ? "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0) 50%)"
            : "linear-gradient(to bottom right, #a855f7, #4f46e5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: showVideo ? "flex-end" : "center",
          gap: showVideo ? 12 : 20,
          paddingBottom: showVideo ? 16 : 0,
          pointerEvents: showVideo ? "none" : "auto",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleShowVideo();
          }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            pointerEvents: "auto",
          }}
          title={showVideo ? "Hide video" : "Show video"}
        >
          {showVideo ? (
            <EyeOff size={16} color="white" />
          ) : (
            <Eye size={16} color="white" />
          )}
        </button>

        {!showVideo && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
            {[0, 1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                style={{
                  width: 8,
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.8)",
                  height: "100%",
                  animation: playing
                    ? `audio-bar 0.9s ease-in-out ${bar * 0.12}s infinite`
                    : "none",
                  transform: playing ? undefined : "scaleY(0.25)",
                  transformOrigin: "bottom",
                }}
              />
            ))}
          </div>
        )}

        {!showVideo && title && (
          <p
            style={{
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              textAlign: "center",
              maxWidth: "85%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              margin: 0,
            }}
          >
            {title}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 24, pointerEvents: "auto" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              skip(-SKIP_SECONDS);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: "rgba(255,255,255,0.8)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            title={`Back ${SKIP_SECONDS}s`}
          >
            <Rewind size={20} fill="currentColor" />
            <span style={{ fontSize: 10 }}>{SKIP_SECONDS}s</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlayback();
            }}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
            }}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause size={24} color="#4338ca" fill="currentColor" />
            ) : (
              <Play size={24} color="#4338ca" fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              skip(SKIP_SECONDS);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: "rgba(255,255,255,0.8)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            title={`Forward ${SKIP_SECONDS}s`}
          >
            <FastForward size={20} fill="currentColor" />
            <span style={{ fontSize: 10 }}>{SKIP_SECONDS}s</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes audio-bar {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
        .yt-audio-embed-frame iframe {
          width: 100%;
          height: 100%;
          display: block;
        }
      `}</style>
    </div>
  );
}
