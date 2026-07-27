import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { MetricsCircle } from "./MetricsCircle";
import { scoreToWordKey } from "../../utils/analysis";
import { AnalysisData } from "../../types";

interface MetricsExplainerModalProps {
  analysisData: AnalysisData;
  onClose: () => void;
}

export function MetricsExplainerModal({
  analysisData,
  onClose,
}: MetricsExplainerModalProps) {
  const { t } = useTranslation("analysis");
  const {
    participation,
    consensusData: { consensus, highConsensusPostCount },
    spicinessData: { spiciness, lowConsensusPostCount },
    reachData: { reach, postersWithHighConsensusPost },
    totalPosters,
    totalVoters,
  } = analysisData;
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 shadow-2xl max-w-md overflow-hidden max-h-[90vh]">
        <DialogTitle className="sr-only">{t("roomVibesMetrics")}</DialogTitle>
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
              {t("roomVibes")}
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

          <div className="p-6 space-y-6 bg-white">
            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <h3 className="text-lg">{t("participation")}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {t("participationDesc")}
              </p>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-sm">
                  <span className="text-purple-700">
                    {t(scoreToWordKey(participation))}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("postersVoters", { posters: totalPosters, voters: totalVoters })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <h3 className="text-lg">{t("consensus")}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {t("consensusDesc")}
              </p>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-sm">
                  <span className="text-blue-700">
                    {t(scoreToWordKey(consensus))}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("highAgreementTakes", { count: highConsensusPostCount })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <h3 className="text-lg">{t("spiciness")}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {t("spicinessDesc")}
              </p>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <div className="text-sm">
                  <span className="text-red-700">
                    {t(scoreToWordKey(spiciness))}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("spicyTakesCount", { count: lowConsensusPostCount })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <h3 className="text-lg">{t("reach")}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {t("reachDesc")}
              </p>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-sm">
                  <span className="text-green-700">
                    {t(scoreToWordKey(reach))}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("postersHighAgreement", { count: postersWithHighConsensusPost })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}