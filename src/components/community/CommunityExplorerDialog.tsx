import { useState, useEffect } from "react";
import { X, TrendingUp, Compass } from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "motion/react";
import { SubHeard } from "../../types";
import { useDebateSession } from "../../hooks/useDebateSession";
import { CommunityListing } from "./CommunityListing";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface CommunityExplorerDialogProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onCommunitiesJoined: () => void;
}

const primaryButton = "bg-green-600 hover:bg-green-700 text-white";
const iconGreen = "w-5 h-5 text-green-500";
const textPrimary = "text-slate-900 font-semibold";
const textMuted = "text-slate-500 text-xs";

export function CommunityExplorerDialog({
  isOpen,
  userId,
  onClose,
  onCommunitiesJoined,
}: CommunityExplorerDialogProps) {
  const { getExplorableSubHeards, joinSubHeard } = useDebateSession();
  const [communities, setCommunities] = useState<SubHeard[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExplorableCommunities();
    }
  }, [isOpen, userId]);

  const loadExplorableCommunities = async () => {
    try {
      setLoading(true);
      const response = await getExplorableSubHeards(userId);
      console.log("Explorable communities response:", response);
      if (response?.success && response.data) {
        setCommunities(response.data);
      }
    } catch (error) {
      console.error("Failed to load explorable communities:", error);
      toast.error("Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const toggleCommunity = (communityName: string) => {
    setSelectedCommunities((prev) =>
      prev.includes(communityName)
        ? prev.filter((name) => name !== communityName)
        : [...prev, communityName]
    );
  };

  const handleJoinCommunities = async () => {
    if (selectedCommunities.length === 0) return;

    try {
      setJoining(true);
      const joinPromises = selectedCommunities.map((communityName) =>
        joinSubHeard(communityName, userId)
      );

      const results = await Promise.all(joinPromises);
      const successCount = results.filter((r) => r?.success).length;

      if (successCount > 0) {
        toast.success(
          `Joined ${successCount} ${successCount === 1 ? "community" : "communities"}!`
        );
        onCommunitiesJoined();
        onClose();
      } else {
        toast.error("Failed to join communities");
      }
    } catch (error) {
      console.error("Failed to join communities:", error);
      toast.error("Failed to join communities");
    } finally {
      setJoining(false);
    }
  };

  if (!isOpen) return null;

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
          <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Discover Communities</h2>
            </div>
            <p className="text-green-100">
              Explore and join public communities to expand your feed
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-200 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : communities.length === 0 ? (
              <div className="text-center py-12">
                <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  No new communities to explore right now
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {communities.map((community, index) => {
                  const isSelected = selectedCommunities.includes(community.name);
                  return (
                    <CommunityListing
                      key={community.name}
                      community={community}
                      isSelected={isSelected}
                      index={index}
                      accentColor="green"
                      onToggle={toggleCommunity}
                    />
                  );
                })}
              </div>
            )}

            {selectedCommunities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={iconGreen} />
                  <span className={textPrimary}>
                    {selectedCommunities.length} {selectedCommunities.length === 1 ? 'community' : 'communities'} selected
                  </span>
                </div>
                <p className={textMuted}>
                  You'll see content from these communities in your feed
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
              Cancel
            </Button>
            <Button
              onClick={handleJoinCommunities}
              disabled={selectedCommunities.length === 0 || joining}
              className={`flex-1 ${primaryButton}`}
            >
              {joining 
                ? "Joining..." 
                : `Join ${selectedCommunities.length} ${selectedCommunities.length === 1 ? "community" : "communities"}`
              }
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}