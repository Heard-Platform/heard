import { motion, AnimatePresence } from "motion/react";
import { Check, MessageSquare } from "lucide-react";
import { getPastelColor } from "../../utils/colors";
import { SubHeard } from "../../types";
import { formatSubHeardDisplay } from "../../utils/subheard";
import { useDarkMode } from "../../contexts/DarkModeContext";

interface CommunityListingProps {
  community: SubHeard;
  index: number;
  accentColor: "blue" | "green";
  isSelected: boolean;
  onToggle: (communityName: string) => void;
}

const textPrimary = "text-slate-900 font-semibold";
const textMuted = "text-slate-500 text-xs";

export function CommunityListing({
  community,
  index,
  accentColor,
  isSelected,
  onToggle,
}: CommunityListingProps) {
  const selectedBorder = accentColor === "blue" 
    ? "border-blue-500 shadow-lg shadow-blue-100"
    : "border-green-500 shadow-lg shadow-green-100";
  const unselectedBorder = accentColor === "blue"
    ? "border-slate-200 hover:border-blue-300"
    : "border-slate-200 hover:border-green-300";
  const checkBg = accentColor === "blue" ? "bg-blue-500" : "bg-green-500";

  const { darkModeOn } = useDarkMode();
  const communityColor = getPastelColor(community.name, darkModeOn);

  const displayName = formatSubHeardDisplay(community.name);
  const postCount = community.count || 0;

  return (
    <motion.button
      key={community.name}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onToggle(community.name)}
      className={`border-2 rounded-2xl transition-all duration-200 ${
        isSelected ? selectedBorder : unselectedBorder
      } ${communityColor} w-full p-4 text-left relative`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={textPrimary}>
              {displayName}
            </h3>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className={`${textMuted} flex items-center gap-1`}>
              <MessageSquare className="w-3 h-3" />
              {postCount.toLocaleString()} posts
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`absolute top-2 right-2 p-1.5 ${checkBg} rounded-full`}
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}