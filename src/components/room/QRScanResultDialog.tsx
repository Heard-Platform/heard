import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, ArrowRight, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { DebateRoom } from "../../types";
import { VoteType } from "../../types";
import moment from "moment";
import { api } from "../../utils/api";
import { useEmailOtpFlow } from "../../hooks/useEmailOtpFlow";
import { useDebateSession } from "../../hooks/useDebateSession";

export type QRScanResult = {
  room: DebateRoom;
  agreePercent: number;
  disagreePercent: number;
  passPercent: number;
  userVote: VoteType;
  statementText: string;
  teaserStatement?: { text: string; timestamp: number; voteCount: number };
};

type CompleteReason = "signup" | "otp-login" | "continue";

interface QRScanResultDialogProps extends QRScanResult {
  isOpen: boolean;
  onComplete: (result: { reason: CompleteReason }) => void;
  onClose: () => void;
}

export function QRScanResultDialog({
  room,
  agreePercent,
  disagreePercent,
  passPercent,
  userVote,
  statementText,
  teaserStatement,
  isOpen,
  onComplete,
  onClose,
}: QRScanResultDialogProps) {
  const { t } = useTranslation(["dialog", "common"]);
  const { user } = useDebateSession();
  const isAlreadyLoggedIn = user && !user.isAnonymous;

  const [showBars, setShowBars] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const emailFlow = useEmailOtpFlow({
    onComplete: ({ wasOtpLogin }) => {
      api.trackEvent("flyer_results_email_submitted", room.id);
      onComplete({ reason: wasOtpLogin ? "otp-login" : "signup" });
    },
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowBars(true), 300);
    } else {
      setShowBars(false);
      setShowEmailCapture(false);
    }
  }, [isOpen]);

  const bars = [
    {
      label: t("qrAgree"),
      percent: agreePercent,
      color: "bg-green-500",
      glowColor: "shadow-green-500/50",
      isUserVote: userVote === "agree",
    },
    {
      label: t("qrDisagree"),
      percent: disagreePercent,
      color: "bg-red-500",
      glowColor: "shadow-red-500/50",
      isUserVote: userVote === "disagree",
    },
    {
      label: t("qrUnsure"),
      percent: passPercent,
      color: "bg-yellow-500",
      glowColor: "shadow-yellow-500/50",
      isUserVote: userVote === "pass",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">{t("qrVoteResults")}</DialogTitle>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-1 rounded-3xl shadow-2xl"
        >
          <div className="bg-slate-900 rounded-3xl p-6 space-y-6">
            <button
              onClick={onClose}
              className="absolute top-7 right-7 rounded-full opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 p-1"
            >
              <X className="w-4 h-4 text-white" />
              <span className="sr-only">{t("common:close")}</span>
            </button>

            <div className="text-center space-y-2">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-white leading-tight"
              >
                {statementText}
              </motion.h2>
            </div>

            <div className="space-y-4">
              {bars.map((bar, index) => (
                <div key={bar.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200">
                        {bar.label}
                      </span>
                      {bar.isUserVote && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: 1.2 + index * 0.1,
                            type: "spring",
                            stiffness: 200,
                          }}
                          className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full"
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          <span className="text-xs text-white font-bold">
                            {t("qrYourVote")}
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-white">
                      {bar.percent}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                    {bar.isUserVote && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{
                          delay: 1.1 + index * 0.1,
                          duration: 1,
                          repeat: Infinity,
                          repeatDelay: 0.5,
                        }}
                        className={`absolute inset-0 ${bar.color} blur-sm`}
                      />
                    )}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: showBars ? `${bar.percent}%` : 0,
                      }}
                      transition={{
                        delay: 0.3 + index * 0.1,
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                      className={`h-full ${bar.color} relative ${
                        bar.isUserVote
                          ? `shadow-lg ${bar.glowColor}`
                          : ""
                      }`}
                    >
                      {bar.isUserVote && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{
                            delay: 1.1 + index * 0.1,
                            duration: 1.5,
                            repeat: 2,
                          }}
                          className="absolute inset-0 bg-white/30"
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider header-4">
                  {t("qrPartOfConversation")}
                </p>
                <p className="text-base font-semibold normal-text leading-relaxed">
                  {room.topic}
                </p>
              </div>

              {teaserStatement && !showEmailCapture && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider header-4">
                    {t("qrOtherResponses")}
                  </p>
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-2">
                    <p className="text-sm text-slate-200 leading-relaxed">
                      "{teaserStatement.text}"
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("qrPosted", {
                        time: moment(teaserStatement.timestamp).fromNow(),
                        count: teaserStatement.voteCount,
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-700" />

              {!showEmailCapture ? (
                <Button
                  onClick={() => {
                    api.trackEvent("flyer_results_get_results_clicked", room.id);
                    if (isAlreadyLoggedIn) {
                      onComplete({ reason: "continue" });
                    } else {
                      setShowEmailCapture(true);
                    }
                  }}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {t("qrVoteRespond")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white">
                      {emailFlow.step === "email"
                        ? t("qrEnterEmail")
                        : t("qrCheckEmail")}
                    </p>
                    <p className="text-sm text-slate-400">
                      {emailFlow.step === "email"
                        ? t("qrEmailDisclaimer")
                        : t("qrCodeSent", { email: emailFlow.email })}
                    </p>
                  </div>

                  {emailFlow.step === "email" ? (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={emailFlow.email}
                        onChange={(e) => emailFlow.setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && emailFlow.submitEmail()}
                        autoFocus
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <Button
                        onClick={emailFlow.submitEmail}
                        disabled={emailFlow.submitting}
                        className="h-auto px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="ABC123"
                          value={emailFlow.otp}
                          onChange={(e) => emailFlow.setOtp(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && emailFlow.submitOtp()}
                          maxLength={6}
                          autoFocus
                          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500 tracking-widest font-mono uppercase"
                        />
                        <Button
                          onClick={emailFlow.submitOtp}
                          disabled={emailFlow.submitting}
                          className="h-auto px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                      <button
                        onClick={emailFlow.goBackToEmail}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3" />
                        {t("qrDifferentEmail")}
                      </button>
                    </div>
                  )}

                  {emailFlow.error && (
                    <p className="text-xs text-red-400">{emailFlow.error}</p>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
