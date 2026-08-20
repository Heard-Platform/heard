import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import {
  Trophy,
  TrendingUp,
  Flame,
  Sparkles,
  Zap,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";
import { createShareableLink } from "../utils/url";
import { analyzeStatements, getAgreePercent, getAwardWinners } from "./results/utils";
import { RenderedStatement } from "./RenderedStatement";
import type { DebateRoom, Statement } from "../types";

type Analysis = ReturnType<typeof analyzeStatements>;

const SLIDE_DURATION_MS = 10000;
const SLIDE_COUNT = 5;

interface DisplayModeScreenProps {
  room: DebateRoom;
  statements: Statement[];
  onClose: () => void;
}

export function DisplayModeScreen({
  room,
  statements,
  onClose,
}: DisplayModeScreenProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SLIDE_COUNT);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const analysis = analyzeStatements(statements);
  const totalVotes = statements.reduce(
    (sum, s) => sum + s.agrees + s.disagrees + s.passes,
    0
  );
  const joinUrl = createShareableLink(room.id);

  if (statements.length === 0) {
    return createPortal(
      <div className="fixed inset-0 display-layer display-bg normal-text flex flex-col items-center justify-center gap-10 p-16">
        <CloseButton onClose={onClose} />
        <h1 className="text-6xl font-bold text-center max-w-5xl">
          {room.topic}
        </h1>
        <p className="text-2xl secondary-text">
          Waiting for the first responses…
        </p>
        <div className="normal-bg rounded-2xl p-6">
          <QRCodeSVG value={joinUrl} size={280} />
        </div>
        <p className="text-xl secondary-text">Scan to join</p>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 display-layer display-bg normal-text flex flex-col overflow-hidden">
      <CloseButton onClose={onClose} />
      <DisplayHeader
        room={room}
        statementCount={statements.length}
        totalVotes={totalVotes}
      />

      <div className="flex-1 min-h-0 px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            {slideIndex === 0 && (
              <StatsSlide analysis={analysis} totalVotes={totalVotes} />
            )}
            {slideIndex === 1 && <LeaderboardSlide analysis={analysis} />}
            {slideIndex === 2 && <AwardsSlide analysis={analysis} />}
            {slideIndex === 3 && <ControversialSlide analysis={analysis} />}
            {slideIndex === 4 && <HiddenGemsSlide analysis={analysis} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <DisplayFooter joinUrl={joinUrl} slideIndex={slideIndex} />
    </div>,
    document.body
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Exit display mode"
      className="absolute top-6 right-6 z-10 p-2 rounded-full display-panel-bg transition-colors"
    >
      <X className="w-6 h-6" />
    </button>
  );
}

function DisplayHeader({
  room,
  statementCount,
  totalVotes,
}: {
  room: DebateRoom;
  statementCount: number;
  totalVotes: number;
}) {
  return (
    <div className="heard-between px-12 py-8 gap-8">
      <h1 className="text-4xl font-bold truncate">{room.topic}</h1>
      <div className="flex items-center gap-8 text-lg secondary-text shrink-0 mr-12">
        <span>{room.participants?.length ?? 0} joined</span>
        <span>{statementCount} statements</span>
        <span>{totalVotes} votes</span>
      </div>
    </div>
  );
}

function DisplayFooter({
  joinUrl,
  slideIndex,
}: {
  joinUrl: string;
  slideIndex: number;
}) {
  return (
    <div className="relative px-12 pb-8 pt-6 heard-between items-end">
      <div className="flex items-center gap-3 normal-bg rounded-xl p-3">
        <QRCodeSVG value={joinUrl} size={72} />
        <span className="text-sm text-slate-600 pr-2">Scan to join</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 display-track-bg">
        <motion.div
          key={slideIndex}
          className="h-full display-progress-fill"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: SLIDE_DURATION_MS / 1000, ease: "linear" }}
        />
      </div>
    </div>
  );
}

function SlideTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      {icon}
      <h2 className="text-5xl font-bold">{title}</h2>
    </div>
  );
}

function EmptySlideMessage({ text }: { text: string }) {
  return <p className="text-2xl secondary-text text-center py-20">{text}</p>;
}

function StatsSlide({
  analysis,
  totalVotes,
}: {
  analysis: Analysis;
  totalVotes: number;
}) {
  const tiles = [
    {
      value: analysis.byAgrees.length,
      label: "Statements",
      colorClass: "neutral-text",
    },
    { value: totalVotes, label: "Votes cast", colorClass: "super-agree-text" },
    {
      value: analysis.consensus.length,
      label: "Consensus statements",
      colorClass: "agree-text",
    },
    {
      value: analysis.controversial.length,
      label: "Split takes",
      colorClass: "attention-text",
    },
    {
      value: analysis.clusters.length,
      label: "Opinion clusters",
      colorClass: "pass-text",
    },
  ];

  return (
    <div className="h-full flex flex-col justify-center">
      <SlideTitle icon={<Zap className="w-10 h-10" />} title="By The Numbers" />
      <div className="grid grid-cols-5 gap-6">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="display-panel-bg rounded-2xl p-8 text-center display-stack-3"
          >
            <div className={`text-7xl font-mono font-bold ${tile.colorClass}`}>
              {tile.value}
            </div>
            <div className="text-lg secondary-text">{tile.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardSlide({ analysis }: { analysis: Analysis }) {
  const top = analysis.byAgrees.slice(0, 5);

  return (
    <div className="h-full flex flex-col justify-center">
      <SlideTitle icon={<TrendingUp className="w-10 h-10" />} title="Top Statements" />
      <div className="display-stack-4">
        {top.map((statement, index) => (
          <div
            key={statement.id}
            className="flex items-center gap-6 display-panel-bg rounded-2xl p-6"
          >
            <div className="text-4xl w-16 text-center shrink-0">
              {index === 0
                ? "🥇"
                : index === 1
                ? "🥈"
                : index === 2
                ? "🥉"
                : `#${index + 1}`}
            </div>
            <div className="flex-1 text-2xl leading-snug">
              <RenderedStatement text={statement.text} />
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <span className="agree-text text-2xl font-bold flex items-center gap-2">
                <ThumbsUp className="w-6 h-6" /> {statement.agrees}
              </span>
              {statement.disagrees > 0 && (
                <span className="disagree-text text-2xl font-bold flex items-center gap-2">
                  <ThumbsDown className="w-6 h-6" /> {statement.disagrees}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AwardsSlide({ analysis }: { analysis: Analysis }) {
  const { mostPersuasive, spiciest, unicorn, bridge } = getAwardWinners(analysis);

  const awards = [
    mostPersuasive && {
      emoji: "👑",
      title: "Most Persuasive",
      value: getAgreePercent(mostPersuasive),
      text: mostPersuasive.text,
      colorClass: "agree-text",
    },
    spiciest && {
      emoji: "🌶️",
      title: "Spiciest Take",
      value: getAgreePercent(spiciest),
      text: spiciest.text,
      colorClass: "attention-text",
    },
    unicorn && {
      emoji: "🦄",
      title: "Unicorn Opinion",
      value: getAgreePercent(unicorn),
      text: unicorn.text,
      colorClass: "super-agree-text",
    },
    bridge && {
      emoji: "🌉",
      title: "Bridge Builder",
      value: getAgreePercent(bridge),
      text: bridge.text,
      colorClass: "neutral-text",
    },
  ].filter(Boolean) as Array<{
    emoji: string;
    title: string;
    value: number;
    text: string;
    colorClass: string;
  }>;

  return (
    <div className="h-full flex flex-col justify-center">
      <SlideTitle icon={<Trophy className="w-10 h-10" />} title="Awards" />
      {awards.length === 0 ? (
        <EmptySlideMessage text="Not enough votes yet for awards." />
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {awards.map((award) => (
            <div
              key={award.title}
              className="display-panel-bg rounded-2xl p-8 display-stack-3"
            >
              <div className="text-5xl">{award.emoji}</div>
              <div className={`text-xl font-medium ${award.colorClass}`}>
                {award.title}
              </div>
              <div className={`text-4xl font-bold ${award.colorClass}`}>
                {award.value}%
                <span className="text-xl font-normal opacity-70"> agreed</span>
              </div>
              <p className="text-xl line-clamp-3 text-slate-200">
                <RenderedStatement text={award.text} />
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ControversialSlide({ analysis }: { analysis: Analysis }) {
  const spicy = analysis.controversial.slice(0, 3);

  return (
    <div className="h-full flex flex-col justify-center">
      <SlideTitle icon={<Flame className="w-10 h-10" />} title="Split Takes" />
      {spicy.length === 0 ? (
        <EmptySlideMessage text="No split statements yet." />
      ) : (
        <div className="space-y-6">
          {spicy.map((statement) => {
            const total = statement.agrees + statement.disagrees;
            const agreePct = total > 0 ? (statement.agrees / total) * 100 : 50;
            return (
              <div
                key={statement.id}
                className="display-panel-bg rounded-2xl p-8 display-stack-4"
              >
                <p className="text-2xl"><RenderedStatement text={statement.text} /></p>
                <div className="heard-between text-lg">
                  <span className="agree-text font-medium">
                    {statement.agrees} agreed
                  </span>
                  <span className="disagree-text font-medium">
                    {statement.disagrees} disagreed
                  </span>
                </div>
                <div className="h-4 rounded-full overflow-hidden display-track-bg flex">
                  <div
                    className="agree-bg h-full"
                    style={{ width: `${agreePct}%` }}
                  />
                  <div
                    className="disagree-bg h-full"
                    style={{ width: `${100 - agreePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HiddenGemsSlide({ analysis }: { analysis: Analysis }) {
  const smallestCluster = [...analysis.clusters].sort(
    (a, b) => a.size - b.size
  )[0];
  const minorityStatements = smallestCluster?.statements.slice(0, 2) ?? [];

  return (
    <div className="h-full flex flex-col justify-center">
      <SlideTitle icon={<Sparkles className="w-10 h-10" />} title="Hidden Gems" />
      {!smallestCluster ? (
        <EmptySlideMessage text="Not enough data to identify clusters yet." />
      ) : (
        <div className="space-y-6">
          <div className="heard-between display-panel-bg rounded-2xl p-6">
            <span className="text-2xl font-medium super-agree-text">
              {smallestCluster.theme}
            </span>
            <span className="text-xl secondary-text">
              {smallestCluster.size} statements
            </span>
          </div>
          <div className="display-stack-4">
            {minorityStatements.map((statement) => (
              <div
                key={statement.id}
                className="display-panel-bg rounded-2xl p-6 text-2xl"
              >
                <RenderedStatement text={statement.text} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 pt-4">
            {analysis.clusters.map((cluster) => (
              <div key={cluster.id} className="flex flex-col items-center gap-2">
                <div
                  className="rounded-full super-agree-bg flex items-center justify-center font-bold text-2xl"
                  style={{
                    width: `${Math.max(64, cluster.size * 14)}px`,
                    height: `${Math.max(64, cluster.size * 14)}px`,
                  }}
                >
                  {cluster.size}
                </div>
                <span className="text-lg secondary-text max-w-[120px] text-center truncate">
                  {cluster.theme}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
