import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { DonateCard } from "./DonateCard";
import { ShareCard } from "./ShareCard";
import { DonationDialog } from "./DonationDialog";
import { C, fmt, PRESET_AMOUNTS, FUNDING_GOAL } from "./constants";
import { api } from "../../utils/api";
import type { ApiResponse } from "../../utils/api-client";

type CardStep = "donate" | "share" | "done";

interface FundingPageProps {
  getFundingStats?: () => Promise<ApiResponse<{ totalDollars: number; donorCount: number }>>;
  createCheckoutSession?: (amount: number, successUrl: string, cancelUrl: string) => Promise<ApiResponse<{ url: string }>>;
  simulateCheckoutSuccess?: boolean;
  onExit?: () => void;
}

export function FundingPage({
  getFundingStats = () => api.getFundingStats(),
  createCheckoutSession = (amount, successUrl, cancelUrl) => api.createCheckoutSession(amount, successUrl, cancelUrl),
  simulateCheckoutSuccess = false,
  onExit,
}: FundingPageProps) {
  const params = new URLSearchParams(window.location.search);
  const returnedWithSuccess = params.get("payment") === "success";
  const returnedAmount = parseInt(params.get("amount") ?? "0", 10) || 0;

  const [amount, setAmount] = useState(returnedAmount || 25);
  const [showAmountPicker, setShowAmountPicker] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [cardStep, setCardStep] = useState<CardStep>(returnedWithSuccess ? "share" : "donate");
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [totalDonated, setTotalDonated] = useState(returnedWithSuccess ? returnedAmount : 0);
  const [donorCount, setDonorCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [nugMode, setNugMode] = useState(false);

  useEffect(() => {
    getFundingStats()
      .then((res) => {
        if (res.success && res.data) {
          setTotalDonated(res.data.totalDollars);
          setDonorCount(res.data.donorCount);
        }
      })
      .finally(() => setStatsLoading(false));

    if (returnedWithSuccess) {
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, []);

  const progressPct = Math.min((totalDonated / FUNDING_GOAL) * 100, 100);

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setShowAmountPicker(false);
    setCustomAmount("");
  };

  const handleCustomConfirm = () => {
    const val = parseInt(customAmount.replace(/\D/g, ""), 10);
    if (val > 0) {
      setAmount(val);
      setShowAmountPicker(false);
      setCustomAmount("");
    }
  };

  const applySuccessState = (donatedAmount: number) => {
    setTotalDonated((prev) => prev + donatedAmount);
    setDonorCount((prev) => prev + 1);
    setCardStep("share");
    setShowDonationDialog(false);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom right, rgb(250, 245, 255), rgb(239, 246, 255))",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 16px 64px",
      position: "relative",
    }}>
      {onExit && (
        <button
          onClick={onExit}
          style={{ position: "absolute", top: 16, left: 16, background: "none", border: "none", cursor: "pointer", color: C.slate500, fontSize: 14, fontWeight: 500, padding: 8 }}
        >
          ← Back
        </button>
      )}

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 384, marginBottom: 40, textAlign: "center" }}>
        <p style={{ color: C.slate400, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 16 }}>
          Support Heard
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.slate900, lineHeight: 1.2, marginBottom: 16 }}>
          The goal I set for July&nbsp;4th
        </h1>
        <p style={{ color: C.slate600, lineHeight: 1.625, marginBottom: 16 }}>
          At the start of 2026, I gave myself a deadline: raise{" "}
          <strong style={{ color: C.slate800 }}>$5,000 in funding by July 4th</strong>, or {" "}
          <strong style={{ color: C.slate800 }}>get a tattoo</strong> chosen via a debate on Heard. We're less than a month away and have some ground to cover 😬
        </p>
        <p style={{ color: C.slate600, lineHeight: 1.625, marginBottom: 20 }}>
          Below you can send over a donation to help me reach my goal. Your gift not only funds my vegan chicken nuggies addiction 🍗 It also tells me there are{" "}
          <strong style={{ color: C.slate800 }}>people out there who believe in what I'm building</strong>, and encourages me to keep working on this project, at least for the rest of year.
        </p>
        <p style={{ color: C.slate500, fontSize: 14, fontStyle: "italic" }}>— Alex Long, founder of Heard</p>
      </div>

      <div style={{ width: "100%", maxWidth: 384, borderTop: `1px solid ${C.slate200}`, marginBottom: 32 }} />

      {/* Perk */}
      <div style={{
        width: "100%",
        maxWidth: 384,
        marginBottom: 32,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 12,
        backgroundColor: C.amber50,
        border: `1px solid ${C.amber200}`,
      }}>
        <span style={{ fontSize: 22 }}>🏅</span>
        <p style={{ fontSize: 14, color: C.amber800, lineHeight: 1.4, margin: 0 }}>
          <span style={{ fontWeight: 600 }}>Donor perk:</span>{" "}
          Anyone who donates will receive a lifetime supporter badge in the Heard app and my lifelong gratitude.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 384, marginBottom: 32 }}>
        {statsLoading ? (
          <>
            <div style={{ height: 20, marginBottom: 8, borderRadius: 6, backgroundColor: C.slate200, width: "70%", opacity: 0.6 }} />
            <div style={{ height: 12, backgroundColor: C.slate200, borderRadius: 999 }} />
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              <motion.span
                style={{ color: C.emerald600 }}
                key={totalDonated}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.4 }}
              >
                {fmt(totalDonated, nugMode)} donated{" "}
                <span style={{ color: C.slate400, fontWeight: 400 }}>by {donorCount} Hearos</span>
              </motion.span>
              <span style={{ color: C.slate400 }}>{fmt(FUNDING_GOAL, nugMode)} goal</span>
            </div>
            <div style={{ height: 12, backgroundColor: C.slate200, borderRadius: 999, overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", backgroundColor: C.emerald500, borderRadius: 999 }}
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </>
        )}
        <button
          onClick={() => setNugMode((v) => !v)}
          style={{
            marginTop: 8,
            fontSize: 12,
            color: C.slate400,
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 2,
            width: "100%",
            textAlign: "right",
            padding: 0,
          }}
        >
          {nugMode ? "Show in dollars 💵" : "Show currency in nuggies 🍗"}
        </button>
      </div>

      {/* Card stack */}
      <div style={{ position: "relative", width: "100%", maxWidth: 384, height: 440, overflow: "hidden" }}>
        {cardStep === "donate" && (
          <>
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: 380,
              borderRadius: 12, border: `2px solid ${C.purple200}`,
              background: `linear-gradient(to bottom right, ${C.purple100}, #faf5ff, ${C.fuchsia100})`,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
              transform: "translateY(20px) scale(0.93)", zIndex: 1,
            }} />
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: 380,
              borderRadius: 12, border: `2px solid ${C.indigo200}`,
              background: `linear-gradient(to bottom right, ${C.indigo100}, ${C.indigo100}, ${C.blue100})`,
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
              transform: "translateY(10px) scale(0.965)", zIndex: 2,
            }} />
            <DonateCard
              key={cardKey}
              amount={amount}
              nugMode={nugMode}
              onSwipeRight={() => setShowDonationDialog(true)}
              onTapAmount={() => setShowAmountPicker(true)}
            />
          </>
        )}

        {cardStep === "share" && (
          <>
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: 380,
              borderRadius: 12, border: `2px solid ${C.pink200}`,
              background: `linear-gradient(to bottom right, ${C.pink100}, ${C.pink100}, ${C.rose100})`,
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
              transform: "translateY(10px) scale(0.965)", zIndex: 1,
            }} />
            <ShareCard onDismiss={() => setCardStep("done")} />
          </>
        )}

        {cardStep === "done" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🙏</p>
            <p style={{ fontSize: 20, fontWeight: 600, color: C.slate700 }}>Thank you</p>
            <p style={{ color: C.slate400, fontSize: 14, marginTop: 4, marginBottom: 24 }}>Here's a big virtual high five in thanks!</p>
            <a
              href="https://heard.vote"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #059669, #0d9488)",
                color: "white",
                fontWeight: 700,
                fontSize: 16,
                textDecoration: "none",
              }}
            >
              Go to Heard →
            </a>
          </div>
        )}
      </div>

      <a
        href="https://substack.com/@alexlongheard"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: C.slate400, fontSize: 14, textDecoration: "underline" }}
      >
        Read the full story on Substack
      </a>

      {/* Amount picker */}
      <Dialog open={showAmountPicker} onOpenChange={setShowAmountPicker}>
        <DialogContent>
          <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: C.slate800, textAlign: "center" }}>
            Choose an amount
          </DialogTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {PRESET_AMOUNTS.map((preset) => {
              const selected = amount === preset;
              return (
                <button
                  key={preset}
                  onClick={() => handleAmountSelect(preset)}
                  style={{
                    padding: "12px 0",
                    borderRadius: 12,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selected ? C.emerald500 : C.slate100,
                    color: selected ? "white" : C.slate700,
                    transform: selected ? "scale(1.05)" : "scale(1)",
                    boxShadow: selected ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{fmt(preset, nugMode)}</span>
                  {nugMode && (
                    <span style={{ fontSize: 11, marginTop: 2, color: selected ? "rgba(255,255,255,0.7)" : C.slate400 }}>
                      ${preset}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomConfirm()}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 12,
                border: `2px solid ${C.slate200}`,
                color: C.slate700,
                fontSize: 16,
                outline: "none",
              }}
            />
            <button
              onClick={handleCustomConfirm}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                backgroundColor: C.emerald500,
                color: "white",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Set
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <DonationDialog
        open={showDonationDialog}
        amount={amount}
        createCheckoutSession={createCheckoutSession}
        onSuccess={simulateCheckoutSuccess ? () => applySuccessState(amount) : undefined}
        onClose={() => { setShowDonationDialog(false); setCardKey((k) => k + 1); }}
      />
    </div>
  );
}
