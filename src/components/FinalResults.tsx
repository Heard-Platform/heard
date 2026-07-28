import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Trophy,
  MessageSquarePlus,
  Calendar,
  Heart,
  Sparkles,
  ChevronLeft,
  Timer,
  Flower2,
  Cat,
  Home,
} from "lucide-react";
import type { Statement } from "../types";

interface FinalResultsProps {
  statements: Statement[];
  score: number;
  gameNumber: number;
  onNewDiscussion: (statement: Statement) => void;
  onScheduleFuture: () => void;
  onNextGame: () => void;
  onBackToLobby: () => void;
}

type ActivityType =
  | "overview"
  | "breathing"
  | "nature"
  | "cute-animals";

export function FinalResults({
  statements,
  score,
  gameNumber,
  onNewDiscussion,
  onScheduleFuture,
  onNextGame,
  onBackToLobby,
}: FinalResultsProps) {
  const { t } = useTranslation("misc");
  const [currentActivity, setCurrentActivity] =
    useState<ActivityType>("overview");
  const [breathingPhase, setBreathingPhase] = useState<
    "inhale" | "hold" | "exhale" | "rest"
  >("inhale");
  const [breathingCycle, setBreathingCycle] = useState(0);

  // Get top statements by category
  const getTopStatements = (
    type?: "bridge" | "crux" | "plurality",
  ) => {
    return statements
      .filter((s) => (type ? s.type === type : !s.type))
      .sort((a, b) => (b.agrees - b.disagrees) - (a.agrees - a.disagrees))
      .slice(0, 3);
  };

  const topBridges = getTopStatements("bridge");
  const topCruxes = getTopStatements("crux");
  const topPluralities = getTopStatements("plurality");
  const topGeneral = getTopStatements();

  const startBreathingExercise = () => {
    setCurrentActivity("breathing");
    setBreathingCycle(0);

    const breathingSequence = () => {
      const phases = [
        { phase: "inhale" as const, duration: 4000 },
        { phase: "hold" as const, duration: 2000 },
        { phase: "exhale" as const, duration: 6000 },
        { phase: "rest" as const, duration: 2000 },
      ];

      let currentPhaseIndex = 0;
      let cycles = 0;

      const nextPhase = () => {
        if (cycles >= 3) return; // 3 cycles total

        const currentPhaseData = phases[currentPhaseIndex];
        setBreathingPhase(currentPhaseData.phase);

        setTimeout(() => {
          currentPhaseIndex++;
          if (currentPhaseIndex >= phases.length) {
            currentPhaseIndex = 0;
            cycles++;
            setBreathingCycle(cycles);
          }
          if (cycles < 3) {
            nextPhase();
          }
        }, currentPhaseData.duration);
      };

      nextPhase();
    };

    breathingSequence();
  };

  const renderStatementCard = (
    statement: Statement,
    rank: number,
  ) => (
    <motion.div
      key={statement.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">#{rank + 1}</span>
              {statement.type && (
                <Badge variant="secondary">
                  {statement.type === "bridge" && t("frBridge")}
                  {statement.type === "crux" && t("frCrux")}
                  {statement.type === "plurality" && t("frPlurality")}
                </Badge>
              )}
              {statement.isSpicy && (
                <Badge variant="destructive">{t("frSpicy")}</Badge>
              )}
              <Badge variant="outline">
                {t("frAgreesDisagrees", { agrees: statement.agrees, disagrees: statement.disagrees })}
              </Badge>
            </div>
            <p className="text-sm mb-2">{statement.text}</p>
            <p className="text-xs text-muted-foreground">
              {t("frByAnonymous")}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNewDiscussion(statement)}
            className="shrink-0 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4 mr-1" />
            {t("frDiscuss")}
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  if (currentActivity === "breathing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          className="text-center space-y-8 max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentActivity("overview")}
              className="self-start"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("frBack")}
            </Button>

            <h2>{t("frBreathingExercise")}</h2>
            <p className="text-muted-foreground">
              {t("frCycleOf", { current: breathingCycle + 1, total: 3 })}
            </p>
          </div>

          <motion.div
            className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center"
            animate={{
              scale:
                breathingPhase === "inhale"
                  ? 1.3
                  : breathingPhase === "hold"
                    ? 1.3
                    : 1,
            }}
            transition={{
              duration:
                breathingPhase === "inhale"
                  ? 4
                  : breathingPhase === "exhale"
                    ? 6
                    : 2,
              ease: "easeInOut",
            }}
          >
            <div className="text-white text-center">
              <Timer className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">
                {breathingPhase === "inhale" && t("frBreatheIn")}
                {breathingPhase === "hold" && t("frHold")}
                {breathingPhase === "exhale" && t("frBreatheOut")}
                {breathingPhase === "rest" && t("frRest")}
              </p>
            </div>
          </motion.div>

          <div className="space-y-2">
            <p>
              {breathingPhase === "inhale" && t("frInhaleMsg")}
              {breathingPhase === "hold" && t("frHoldMsg")}
              {breathingPhase === "exhale" && t("frExhaleMsg")}
              {breathingPhase === "rest" && t("frRestMsg")}
            </p>
          </div>

          {breathingCycle >= 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-green-600 font-medium">
                {t("frGreatJob")}
              </p>
              <Button
                onClick={() => setCurrentActivity("overview")}
              >
                {t("frReturnResults")}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  if (currentActivity === "nature") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          className="text-center space-y-6 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Button
            variant="ghost"
            onClick={() => setCurrentActivity("overview")}
            className="self-start"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t("frBack")}
          </Button>

          <div className="space-y-4">
            <Flower2 className="w-12 h-12 mx-auto text-green-600" />
            <h2>{t("frNatureBreak")}</h2>
            <p className="text-muted-foreground">
              {t("frNatureDesc")}
            </p>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1730963782375-f40cffade823?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBmb3Jlc3QlMjBwZWFjZWZ1bHxlbnwxfHx8fDE3NTc5NDcwODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt={t("frForestAlt")}
              className="w-full h-64 object-cover"
            />
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t("frNature1")}</p>
            <p>{t("frNature2")}</p>
            <p>{t("frNature3")}</p>
          </div>

          <Button
            onClick={() => setCurrentActivity("overview")}
            className="mt-6"
          >
            {t("frRefreshed")}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (currentActivity === "cute-animals") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center p-4">
        <motion.div
          className="text-center space-y-6 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Button
            variant="ghost"
            onClick={() => setCurrentActivity("overview")}
            className="self-start"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t("frBack")}
          </Button>

          <div className="space-y-4">
            <Cat className="w-12 h-12 mx-auto text-orange-600" />
            <h2>{t("frCuteness")}</h2>
            <p className="text-muted-foreground">
              {t("frCuteDesc")}
            </p>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1619774946815-3e1eeeb445fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2F0JTIwcGVhY2VmdWx8ZW58MXx8fHwxNzU3OTQ3NDczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt={t("frCatAlt")}
              className="w-full h-64 object-cover"
            />
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t("frCute1")}</p>
            <p>{t("frCute2")}</p>
            <p>{t("frCute3")}</p>
          </div>

          <Button
            onClick={() => setCurrentActivity("overview")}
            className="mt-6"
          >
            <Heart className="w-4 h-4 mr-1" />
            {t("frBetter")}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1>{t("frGameComplete", { number: gameNumber })}</h1>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-muted-foreground">
            <Trans
              t={t}
              i18nKey="frEarnedPoints"
              values={{ count: score }}
              components={{ b: <span className="font-medium text-primary" /> }}
            />
          </p>
        </motion.div>

        <Separator />

        {/* Top Statements */}
        <div className="space-y-6">
          <h2 className="text-center">{t("frTopStatements")}</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bridges */}
            {topBridges.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2">
                  <span>{t("frBestBridges")}</span>
                  <Badge variant="secondary">
                    {t("frConsensusBuilding")}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {topBridges.map((statement, index) =>
                    renderStatementCard(statement, index),
                  )}
                </div>
              </div>
            )}

            {/* Cruxes */}
            {topCruxes.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2">
                  <span>{t("frKeyCruxes")}</span>
                  <Badge variant="secondary">{t("frCoreIssues")}</Badge>
                </h3>
                <div className="space-y-2">
                  {topCruxes.map((statement, index) =>
                    renderStatementCard(statement, index),
                  )}
                </div>
              </div>
            )}

            {/* Pluralities */}
            {topPluralities.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2">
                  <span>{t("frFreshPerspectives")}</span>
                  <Badge variant="secondary">
                    {t("frUnderrepresented")}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {topPluralities.map((statement, index) =>
                    renderStatementCard(statement, index),
                  )}
                </div>
              </div>
            )}

            {/* General */}
            {topGeneral.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2">
                  <span>{t("frMostPopular")}</span>
                  <Badge variant="secondary">
                    {t("frCommunityFavorites")}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {topGeneral.map((statement, index) =>
                    renderStatementCard(statement, index),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Action Options */}
        <div className="space-y-6">
          <h2 className="text-center">{t("frWhatsNext")}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Continue This Topic */}
            <Card className="p-6 text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3>{t("frContinueTopic")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("frContinueDesc")}
                </p>
              </div>
              <Button onClick={onNextGame} className="w-full">
                {t("frNextRound")}
              </Button>
            </Card>

            {/* Back to Lobby */}
            <Card className="p-6 text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                <Home className="w-6 h-6 text-orange-600" />
              </div>
              <div className="space-y-2">
                <h3>{t("frBrowsePosts")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("frBrowseDesc")}
                </p>
              </div>
              <Button onClick={onBackToLobby} variant="outline" className="w-full">
                {t("frBackToLobby")}
              </Button>
            </Card>

            {/* Schedule Future */}
            <Card className="p-6 text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3>{t("frJoinScheduled")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("frJoinDesc")}
                </p>
              </div>
              <Button
                onClick={onScheduleFuture}
                variant="outline"
                className="w-full"
              >
                {t("frSignUp")}
              </Button>
            </Card>

            {/* De-tension Activities */}
            <Card className="p-6 text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3>{t("frTakeBreather")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("frBreatherDesc")}
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={startBreathingExercise}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {t("frGuidedBreathing")}
                </Button>
                <Button
                  onClick={() => setCurrentActivity("nature")}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {t("frNatureScenes")}
                </Button>
                <Button
                  onClick={() =>
                    setCurrentActivity("cute-animals")
                  }
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {t("frCuteAnimals")}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}