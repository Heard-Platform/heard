import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Compass } from "lucide-react";
import type { SubHeard } from "../../types";
import { useDebateSession } from "../../hooks/useDebateSession";
import { formatSubHeardDisplay } from "../../utils/subheard";
import { pickWeightedRandomCommunities } from "../../utils/communitySampling";
import { CommunityExplorerDialog } from "../community/CommunityExplorerDialog";
import { api } from "../../utils/api";

const FEATURED_COMMUNITY_COUNT = 3;

const CHIP_PALETTE: { background: string; text: string }[] = [
  { background: "#FDE7EF", text: "#9D174D" },
  { background: "#E7F0FD", text: "#1E3A8A" },
  { background: "#FEF3E2", text: "#92400E" },
  { background: "#E9F9EF", text: "#065F46" },
  { background: "#F2E9FD", text: "#5B21B6" },
  { background: "#E7FBF9", text: "#0F766E" },
];

const stripStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  maxWidth: "var(--room-card-max-width)",
  padding: "12px 12px 12px 16px",
  borderRadius: "16px",
  backgroundColor: "#3D3564",
  boxSizing: "border-box",
};

const contentColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  flex: 1,
  minWidth: 0,
};

const titleStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#D4D4D8",
  whiteSpace: "nowrap",
};

const emptyStateStyle: CSSProperties = {
  fontSize: "13px",
  color: "#A1A1AA",
};

const chipRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  overflowX: "auto",
};

const chipButtonBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "999px",
  border: "none",
  fontSize: "13px",
  fontWeight: 600,
  whiteSpace: "nowrap",
  cursor: "pointer",
  flexShrink: 0,
};

const chipSkeletonStyle: CSSProperties = {
  height: "30px",
  width: "72px",
  borderRadius: "999px",
  backgroundColor: "rgba(255, 255, 255, 0.12)",
  flexShrink: 0,
};

const joiningDotStyle: CSSProperties = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: "currentColor",
};

const browseButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  border: "none",
  backgroundColor: "#FFFFFF",
  cursor: "pointer",
  flexShrink: 0,
  padding: 0,
};

function chipColorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return CHIP_PALETTE[Math.abs(hash) % CHIP_PALETTE.length];
}

interface CommunityTeaserProps {
  currentUserId?: string;
  currentSubHeard?: string;
  onSelectCommunity: (subHeardName: string) => void;
}

export function CommunityTeaser({
  currentUserId,
  currentSubHeard,
  onSelectCommunity,
}: CommunityTeaserProps) {
  const { getExplorableSubHeards, joinSubHeard } = useDebateSession();
  const [pool, setPool] = useState<SubHeard[] | null>(null);
  const [joiningName, setJoiningName] = useState<string | null>(null);
  const [showExplorer, setShowExplorer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getExplorableSubHeards().then((response) => {
      if (cancelled) return;
      if (response?.success && response.data) {
        setPool(response.data.filter((c) => c.name !== currentSubHeard));
      } else {
        setPool([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentSubHeard]);

  const featured = useMemo(() => {
    if (!pool) return null;
    return pickWeightedRandomCommunities(pool, FEATURED_COMMUNITY_COUNT);
  }, [pool]);

  const handleSelect = async (community: SubHeard) => {
    if (joiningName) return;
    setJoiningName(community.name);
    api.trackEvent("community_teaser_tapped");
    const response = await joinSubHeard(community.name);
    setJoiningName(null);
    if (response?.success) {
      onSelectCommunity(community.name);
    }
  };

  const handleOpenExplorer = () => {
    api.trackEvent("community_teaser_browse");
    setShowExplorer(true);
  };

  return (
    <>
      <div style={stripStyle}>
        <div style={contentColumnStyle}>
          <span style={titleStyle}>Communities you might like</span>

          {featured === null ? (
            <div style={chipRowStyle}>
              {Array.from({ length: FEATURED_COMMUNITY_COUNT }).map((_, i) => (
                <div key={i} style={chipSkeletonStyle} />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <span style={emptyStateStyle}>No new communities right now</span>
          ) : (
            <div style={chipRowStyle}>
              {featured.map((community) => {
                const colors = chipColorFor(community.name);
                const isJoining = joiningName === community.name;
                return (
                  <button
                    key={community.name}
                    type="button"
                    disabled={!!joiningName}
                    onClick={() => handleSelect(community)}
                    style={{
                      ...chipButtonBaseStyle,
                      backgroundColor: colors.background,
                      color: colors.text,
                      opacity: joiningName && !isJoining ? 0.5 : 1,
                    }}
                  >
                    {isJoining && <span style={joiningDotStyle} />}
                    {formatSubHeardDisplay(community.name)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Browse all communities"
          style={browseButtonStyle}
          onClick={handleOpenExplorer}
        >
          <Compass size={16} color="#3F3F46" />
        </button>
      </div>

      <CommunityExplorerDialog
        isOpen={showExplorer}
        userId={currentUserId ?? ""}
        cancelButtonText="Close"
        onCommunitiesJoined={(names) => {
          setShowExplorer(false);
          if (names[0]) onSelectCommunity(names[0]);
        }}
        onClose={() => setShowExplorer(false)}
      />
    </>
  );
}
