import { motion } from "motion/react";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { MetricsCircle } from "./MetricsCircle";
import { scoreToWord } from "../../utils/analysis";
import { AnalysisData } from "../../types";

interface MetricsExplainerModalProps {
  analysisData: AnalysisData;
  onClose: () => void;
}

export function MetricsExplainerModal({
  analysisData,
  onClose,
}: MetricsExplainerModalProps) {
  const {
    participation,
    consensusData: { consensus, highConsensusPostCount },
    spicinessData: { spiciness, lowConsensusPostCount },
    reachData: { reach, postersWithHighConsensusPost },
    totalPosters,
    totalVoters,
  } = analysisData;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
        }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[90vh] pb-6">
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-8 pb-4">
            <h2 className="text-2xl text-white mb-6 pr-8">
              Room Vibes 🎯
            </h2>
            <div className="flex justify-center">
              <MetricsCircle
                participation={participation}
                consensus={consensus}
                spiciness={spiciness}
                reach={reach}
                size={180}
              />
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <h3 className="text-lg">Participation</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Are we hearing from everyone? Compares how many people
                are posting to people voting.
              </p>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-sm">
                  <span className="text-purple-700">
                    {scoreToWord(participation)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {totalPosters} posters, {totalVoters} voters
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <h3 className="text-lg">Consensus</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Are people vibing? Shows how many posts got strong
                agreement from the crowd.
              </p>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-sm">
                  <span className="text-blue-700">
                    {scoreToWord(consensus)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {highConsensusPostCount} takes with high agreement
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <h3 className="text-lg">Spiciness</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                What's life without a little spice? This shows if
                there's a good mix of differing opinions.
              </p>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <div className="text-sm">
                  <span className="text-red-700">
                    {scoreToWord(spiciness)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {lowConsensusPostCount} spicy takes
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <h3 className="text-lg">Reach</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Are quieter voices being heard? Shows how many
                different people dropped a take that resonated with
                the crowd.
              </p>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-sm">
                  <span className="text-green-700">
                    {scoreToWord(reach)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {postersWithHighConsensusPost} posters with a
                  high-agreement take
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
