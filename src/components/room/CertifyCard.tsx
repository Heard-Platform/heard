import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Bell, PartyPopper, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDebateSession } from "../../hooks/useDebateSession";
import { isValidPhone, formatPhone } from "../../utils/validation";
import { TOSText } from "../onboarding/TOSText";

type Step = "phone" | "code" | "success";

interface CertifyCardProps {
  onSuccess: () => void;
}

export function CertifyCard({
  onSuccess,
}: CertifyCardProps) {
  const { sendSmsCode, verifySmsCode } = useDebateSession();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!isValidPhone(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await sendSmsCode(formatPhone(phone));
      if (response && response.success) {
        setStep("code");
      } else {
        setError("Couldn't send code. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length < 4) {
      setError("Please enter the verification code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await verifySmsCode(formatPhone(phone), code);
      if (response && response.success) {
        setStep("success");
        setTimeout(onSuccess, 1800);
      } else {
        setError("Invalid code. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-5 h-5 text-emerald-600" />
        <span className="text-lg text-emerald-700">
          Stay in the loop
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === "phone" && (
          <motion.div
            key="phone"
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <div className="mb-6 flex flex-col items-center space-y-1 text-center">
              <p
                className="text-lg text-foreground"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                }}
              >
                This discussion is just getting started 👀
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Drop your number here to get the final results when
                voting closes.
              </p>
            </div>

            <div className="mb-4 w-full max-w-xs">
              <div className="relative">
                <motion.div
                  className="absolute -inset-1 rounded-lg bg-emerald-400 opacity-30"
                  animate={{
                    scale: [1, 1.04, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                />
                <div className="relative flex gap-2">
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder="(555) 555-5555"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendCode()
                    }
                    className="bg-background"
                  />
                  <Button
                    onClick={handleSendCode}
                    disabled={loading}
                    size="icon"
                    className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          ease: "linear",
                        }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="text-xs text-red-500 mt-1 text-center">
                  {error}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-emerald-200 w-full text-center">
              <TOSText />
            </div>
          </motion.div>
        )}

        {step === "code" && (
          <motion.div
            key="code"
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <div className="mb-5 flex flex-col items-center space-y-2 text-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Bell className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <h3 className="text-xl font-semibold">
                Almost there! 🎉
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                We texted a code to{" "}
                <span className="font-medium text-foreground">
                  {phone}
                </span>
                .
              </p>
            </div>

            <div className="mb-4 w-full max-w-xs">
              <div className="flex gap-2">
                <Input
                  type="number"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleVerify()
                  }
                  className="text-center tracking-widest"
                />
                <Button
                  onClick={handleVerify}
                  disabled={loading}
                  size="icon"
                  className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        ease: "linear",
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-xs text-red-500 mt-1 text-center">
                  {error}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-emerald-200 w-full text-center">
              <button
                className="text-xs text-emerald-700 hover:text-emerald-900 transition-colors"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError(null);
                }}
              >
                ← Wrong number?
              </button>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            className="min-h-[120px] flex flex-col items-center justify-center space-y-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.1,
              }}
            >
              <PartyPopper className="w-14 h-14 text-emerald-500" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-semibold">
                You're in! 🎊
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                We'll text you when the results are in.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
