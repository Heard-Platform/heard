import { useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import type { PanInfo } from "motion/react";
import { Copy, Check, Share2 } from "lucide-react";
import { C, SHARE_URL } from "./constants";
import { share } from "../../utils/share";
import { api } from "../../utils/api";

interface ShareCardProps {
  onDismiss: () => void;
}

export function ShareCard({ onDismiss }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500 || info.offset.y > 100) {
      onDismiss();
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    api.trackEvent("funding_share_copy");
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    api.trackEvent("funding_share_native");
    share({ url: SHARE_URL, title: "Support Heard" });
  };

  return (
    <motion.div
      style={{ x, y, rotate, opacity: cardOpacity, zIndex: 10, touchAction: "none", position: "absolute", top: 0, left: 0, width: "100%" }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        padding: 32,
        borderRadius: 12,
        border: `2px solid ${C.violet300}`,
        background: `linear-gradient(to bottom right, ${C.violet100}, ${C.violet50}, #f0ebff)`,
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        cursor: "grab",
        userSelect: "none",
        position: "relative",
        minHeight: 380,
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 316 }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>📣</div>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.slate800, lineHeight: 1.375, marginBottom: 12 }}>
            Spread the word
          </p>
          <p style={{ color: C.slate600, lineHeight: 1.625, marginBottom: 32 }}>
            Know someone who'd want to help Heard reach its goal? Send them this link.
          </p>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleCopy}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 0",
                borderRadius: 12,
                backgroundColor: C.violet500,
                color: "white",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy link"}
            </button>

            {typeof navigator.share === "function" && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleShare}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 0",
                  borderRadius: 12,
                  border: `2px solid ${C.violet300}`,
                  color: "#6d28d9",
                  fontWeight: 600,
                  backgroundColor: "transparent",
                  cursor: "pointer",
                }}
              >
                <Share2 size={16} />
                Share
              </button>
            )}
          </div>

          <p style={{ color: C.slate400, fontSize: 12, marginTop: 24 }}>swipe to dismiss</p>
        </div>
      </div>
    </motion.div>
  );
}
