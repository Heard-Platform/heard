import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DonationDialog } from "./DonationDialog";
import { DonateCTA } from "./DonateCTA";
import { Countdown } from "./Countdown";
import { C, fmt, FUNDING_GOAL, SHARE_URL, styles } from "./constants";
import { share } from "../../utils/share";
import { api } from "../../utils/api";
import type { ApiResponse } from "../../utils/api-client";

interface FundingPageProps {
  getFundingStats?: () => Promise<ApiResponse<{ totalDollars: number; donorCount: number }>>;
  createCheckoutSession?: (amount: number, successUrl: string, cancelUrl: string) => Promise<ApiResponse<{ url: string }>>;
  simulateCheckoutSuccess?: boolean;
}

export function FundingPage({
  getFundingStats = () => api.getFundingStats(),
  createCheckoutSession = (amount, successUrl, cancelUrl) => api.createCheckoutSession(amount, successUrl, cancelUrl),
  simulateCheckoutSuccess = false,
}: FundingPageProps) {
  const params = new URLSearchParams(window.location.search);
  const returnedWithSuccess = params.get("payment") === "success";
  const returnedAmount = parseInt(params.get("amount") ?? "0", 10) || 0;

  const [amount, setAmount] = useState(returnedAmount || 25);
  const [donated, setDonated] = useState(returnedWithSuccess);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [totalDonated, setTotalDonated] = useState(returnedWithSuccess ? returnedAmount : 0);
  const [donorCount, setDonorCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [nugMode, setNugMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);


  useEffect(() => {
    api.trackEvent("funding_page_view");
    getFundingStats()
      .then((res) => {
        if (res.success && res.data) {
          setTotalDonated(res.data.totalDollars);
          setDonorCount(res.data.donorCount);
        }
      })
      .finally(() => setStatsLoading(false));

    if (returnedWithSuccess) {
      api.trackEvent("funding_donation_success");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const progressPct = Math.min((totalDonated / FUNDING_GOAL) * 100, 100);

  const handleDonate = (amt: number) => {
    api.trackEvent("funding_donate_clicked");
    setAmount(amt);
    setShowDonationDialog(true);
  };

  const handleShare = () => {
    api.trackEvent("funding_share_clicked");
    share({
      url: SHARE_URL,
      title: "Support Heard",
      onSuccess: () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
    });
  };

  const applySuccessState = (donatedAmount: number) => {
    api.trackEvent("funding_donation_success");
    setTotalDonated((prev) => prev + donatedAmount);
    setDonorCount((prev) => prev + 1);
    setDonated(true);
    setShowDonationDialog(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right, rgb(250, 245, 255), rgb(239, 246, 255))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 64px",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          alignSelf: "stretch",
          marginLeft: -16,
          marginRight: -16,
          borderBottom: `1px solid ${C.slate200}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 24px",
          marginBottom: 20,
        }}
      >
        <a
          href="https://heard.vote"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <img
            src="/monkey.png"
            alt="Heard"
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: C.violet500,
              letterSpacing: "-0.01em",
            }}
          >
            Heard
          </span>
        </a>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 384,
          marginBottom: 40,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: C.slate900,
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          Fund Heard. Pick my tattoo.
        </h1>
        <p
          style={{
            color: C.slate500,
            fontSize: 16,
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          If we get $5,000 in donations by July 4th, you vote on what I get inked
        </p>

        {/* YouTube video placeholder (portrait) */}
        <div
          style={{
            width: "100%",
            height: 200,
            marginBottom: 32,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#000",
            flexShrink: 0,
          }}
        >
          <iframe
            style={{ width: "100%", height: "100%", border: "none" }}
            src="https://www.youtube.com/embed/jFzidavpm_4"
            title="Heard funding video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <Countdown />
        {/* Header */}
        <p style={styles.paragraph}>
          In January, I launched Heard as a way for people to talk to each other across divides.{" "}
          <strong style={styles.strong}>
            We've already had 400+ DC residents use it
          </strong>{" "}
           to discuss local matters and now I need to raise a little money.
        </p>
        <p style={styles.paragraph}>
          So here’s the deal: if Heard raises{" "}
          <strong style={styles.strong}>
            $5,000 by July 4th,{" "}
          </strong>
          I'll get a temporary tattoo (lasting 1-2 years), voted on by donors.          
        </p>
        <p style={styles.paragraph}>
          Your donation not only buys you <strong style={styles.strong}>a vote on the design</strong>. It also funds my vegan chicken nuggies addiction 🍗 and encourages me as I continue forward with Heard.
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 384,
          borderTop: `1px solid ${C.slate200}`,
          marginBottom: 32,
        }}
      />

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 384, marginBottom: 40 }}>
        {statsLoading ? (
          <>
            <div
              style={{
                height: 20,
                marginBottom: 8,
                borderRadius: 6,
                backgroundColor: C.slate200,
                width: "70%",
                opacity: 0.6,
              }}
            />
            <div
              style={{
                height: 12,
                backgroundColor: C.slate200,
                borderRadius: 999,
              }}
            />
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              <motion.span
                style={{ color: C.emerald600 }}
                key={totalDonated}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.4 }}
              >
                {fmt(totalDonated, nugMode)} donated{" "}
                {donorCount > 10 && (
                  <span style={{ color: C.slate400, fontWeight: 400 }}>
                    by {donorCount} Hearos
                  </span>
                )}
              </motion.span>
              <span style={{ color: C.slate400, fontWeight: 400 }}>
                {fmt(FUNDING_GOAL, nugMode)} goal
              </span>
            </div>
            <div
              style={{
                height: 12,
                backgroundColor: C.slate200,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <motion.div
                style={{
                  height: "100%",
                  backgroundColor: C.emerald500,
                  borderRadius: 999,
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </>
        )}
        <button
          onClick={() => {
            api.trackEvent("funding_nugmode_toggled");
            setNugMode((v) => !v);
          }}
          style={{
            marginTop: 8,
            fontSize: 12,
            color: C.slate400,
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 2,
            padding: 0,
            width: "100%",
            textAlign: "right",
          }}
        >
          {nugMode ? "Show in dollars 💵" : "Show in nuggies 🍗"}
        </button>
      </div>

      {/* Donate CTA or thank you */}
      {donated ? (
        <div
          style={{
            width: "100%",
            maxWidth: 384,
            textAlign: "center",
            padding: "32px 0",
          }}
        >
          <p style={{ fontSize: 48, marginBottom: 16 }}>🙏</p>
          <p
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: C.slate700,
            }}
          >
            Thank you!
          </p>
          <p
            style={{
              color: C.slate400,
              fontSize: 14,
              marginTop: 4,
              marginBottom: 24,
            }}
          >
            Your support means everything.
          </p>
          <a
            href="https://heard.vote"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              api.trackEvent("funding_go_to_heard_clicked")
            }
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
      ) : (
        <DonateCTA
          nugMode={nugMode}
          copied={copied}
          onDonate={handleDonate}
          onShare={handleShare}
        />
      )}

      <a
        href="https://alexlongheard.substack.com/p/the-future-of-dcs-next-community"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          api.trackEvent("funding_substack_link_clicked")
        }
        style={{
          marginTop: 32,
          color: C.slate400,
          fontSize: 14,
          textDecoration: "underline",
        }}
      >
        Read the full story on Substack
      </a>

      <DonationDialog
        open={showDonationDialog}
        amount={amount}
        createCheckoutSession={createCheckoutSession}
        onSuccess={
          simulateCheckoutSuccess
            ? () => applySuccessState(amount)
            : undefined
        }
        onClose={() => setShowDonationDialog(false)}
      />

    </div>
  );
}
