import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
// @ts-ignore
import { toast } from "sonner@2.0.3";
import { ThumbsUp, ThumbsDown, Share, X } from "lucide-react";
import { Button } from "./ui/button";
import { RenderedStatement } from "./RenderedStatement";
import { createShareableLink } from "../utils/url";
import { share } from "../utils/share";
import { api } from "../utils/api";
import { calcSwingBeforeAndAfter } from "../utils/statement";
import type { Statement, VoteType } from "../types";

interface VoteSwingOverlayProps {
  statement: Statement;
  voteType: VoteType;
  onClose: () => void;
}

type Side = "agree" | "disagree";

const CONFETTI_COLORS = ["#22c55e", "#f43f5e", "#f59e0b", "#3b82f6", "#a855f7"];

function TugBar({
  side,
  fromPercentage,
  toPercentage,
  onAnimationComplete,
}: {
  side: Side;
  fromPercentage: number;
  toPercentage: number;
  onAnimationComplete?: () => void;
}) {
  const isAgree = side === "agree";
  return (
    <motion.div
      className={
        isAgree
          ? "absolute left-0 top-0 h-full bg-gradient-to-r agree-gradient-from agree-gradient-to"
          : "absolute right-0 top-0 h-full bg-gradient-to-l disagree-gradient-from disagree-gradient-to"
      }
      initial={{ width: `${fromPercentage}%` }}
      animate={{ width: `${toPercentage}%` }}
      transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
      onAnimationComplete={onAnimationComplete}
    />
  );
}

function ConfettiBurst() {
  const [particles] = useState(() =>
    Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const distance = 90 + Math.random() * 60;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      };
    }),
  );
  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function VoteSwingOverlay({
  statement,
  voteType,
  onClose,
}: VoteSwingOverlayProps) {
  const [settled, setSettled] = useState(false);

  const { id: statementId, text: statementText, roomId } = statement;
  const { beforeAgreePercent, afterAgreePercent } = calcSwingBeforeAndAfter(
    statement,
    voteType,
  );

  useEffect(() => {
    setSettled(false);
    api.trackEvent("vote_swing_seen", roomId);
  }, [roomId]);

  const handleShare = async () => {
    api.trackEvent("vote_swing_share_clicked", roomId);
    const link = `${createShareableLink(roomId)}?statement=${statementId}`;
    await share({
      url: link,
      title: "You swung the vote!",
      text: `Know anyone else who wants to weigh in? "${statementText}" ${link}`,
      onSuccess: () => toast.success("Link copied to clipboard!"),
      onError: (error) => {
        toast.error("Failed to share link");
        console.error("Share error:", error);
      },
    });
  };

  const displayAgreePercent = Math.round(
    settled ? afterAgreePercent : beforeAgreePercent,
  );
  const displayDisagreePercent = 100 - displayAgreePercent;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-900 bg-gradient-to-br from-pink-100 to-rose-100"
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ConfettiBurst />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/40 hover:bg-white/60 flex items-center justify-center text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            You Swung the Vote!
          </h1>

          <p className="text-xs sm:text-sm text-slate-700 bg-white/50 rounded-xl px-4 py-2 w-full truncate">
            “<RenderedStatement text={statementText} />”
          </p>

          <div className="w-full mt-2">
            <div className="relative h-8 bg-white/50 rounded-full overflow-hidden">
              <TugBar
                side="agree"
                fromPercentage={beforeAgreePercent}
                toPercentage={afterAgreePercent}
                onAnimationComplete={() => setSettled(true)}
              />
              <TugBar
                side="disagree"
                fromPercentage={100 - beforeAgreePercent}
                toPercentage={100 - afterAgreePercent}
              />
              <div className="absolute left-1/2 top-0 h-full w-px bg-white/60 -translate-x-1/2 z-10" />
              <div className="absolute inset-0 z-20 flex items-center justify-between px-3 text-xs sm:text-sm font-semibold text-white">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {displayAgreePercent}%
                </span>
                <span className="flex items-center gap-1">
                  {displayDisagreePercent}%
                  <ThumbsDown className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          <div className="w-full mt-2 flex flex-col items-center gap-2">
            <p className="text-xs sm:text-sm text-slate-600">
              Looks like one person really can make a difference.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleShare}>
                <Share className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
