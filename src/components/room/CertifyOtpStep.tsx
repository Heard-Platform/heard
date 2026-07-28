import { Button } from "../ui/button";
import { motion } from "motion/react";
import { Send, Sparkles } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { OtpCodeInput } from "../auth/OtpCodeInput";

interface CertifyOtpStepProps {
  email: string;
  otp: string;
  error: string | null;
  loading: boolean;
  onOtpChange: (otp: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function CertifyOtpStep({
  email,
  otp,
  error,
  loading,
  onOtpChange,
  onSubmit,
  onBack,
}: CertifyOtpStepProps) {
  const { t } = useTranslation("room");
  return (
    <motion.div
      key="otp"
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <div className="mb-6 flex flex-col items-center space-y-1 text-center">
        <p
          className="text-lg text-foreground"
          style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}
        >
          {t("certifyWelcomeBack")}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          <Trans
            t={t}
            i18nKey="certifyCodeSent"
            values={{ email }}
            components={{ email: <span className="font-semibold" /> }}
          />
        </p>
      </div>

      <div className="mb-4 w-full max-w-xs flex flex-col items-center gap-3">
        <OtpCodeInput
          value={otp}
          slotClassName="creation-bg creation-border normal-text"
          onChange={onOtpChange}
        />

        <Button
          onClick={onSubmit}
          disabled={loading}
          className="creation-bg-strong hover:creation-bg-strong-hover w-full"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="flex items-center"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" /> {t("certifyLogIn")}
            </span>
          )}
        </Button>

        {error && (
          <p className="text-xs error-text text-center">{error}</p>
        )}

        <button
          type="button"
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          {t("certifyDifferentEmail")}
        </button>
      </div>
    </motion.div>
  );
}
