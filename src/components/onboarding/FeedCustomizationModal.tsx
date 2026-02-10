import { useState } from "react";
import { X, Hash, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "motion/react";
import { SubHeard } from "../../types";
import { CommunityListing } from "../community/CommunityListing";

interface FeedCustomizationModalProps {
  open: boolean;
  communities: SubHeard[];
  onComplete: (selectedCommunities: string[]) => void;
  onClose: () => void;
}

const primaryButton = "bg-blue-600 hover:bg-blue-700 text-white";
const iconBlue = "w-5 h-5 text-blue-500";
const textPrimary = "text-slate-900 font-semibold";
const textMuted = "text-slate-500 text-xs";

export function FeedCustomizationModal({
  open,
  communities,
  onComplete,
  onClose,
}: FeedCustomizationModalProps) {
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  const toggleCommunity = (communityName: string) => {
    setSelectedCommunities((prev) =>
      prev.includes(communityName)
        ? prev.filter((name) => name !== communityName)
        : [...prev, communityName]
    );
  };

  const handleComplete = () => {
    onComplete(selectedCommunities);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Hash className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Customize Your Feed</h2>
            </div>
            <p className="text-blue-100">
              Choose communities you're interested in to personalize your experience
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {communities.map((community, index) => {
                const isSelected = selectedCommunities.includes(community.name);
                return (
                  <CommunityListing
                    key={community.name}
                    community={community}
                    index={index}
                    accentColor="blue"
                    isSelected={isSelected}
                    onToggle={toggleCommunity}
                  />
                );
              })}
            </div>

            {selectedCommunities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={iconBlue} />
                  <span className={textPrimary}>
                    {selectedCommunities.length} {selectedCommunities.length === 1 ? 'community' : 'communities'} selected
                  </span>
                </div>
                <p className={textMuted}>
                  You'll see more content from these communities in your feed
                </p>
              </motion.div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-300 hover:bg-slate-100"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleComplete}
              disabled={selectedCommunities.length === 0}
              className={`flex-1 ${primaryButton}`}
            >
              Continue
              {selectedCommunities.length > 0 && ` with ${selectedCommunities.length}`}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
