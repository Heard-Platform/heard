import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Shield, CheckCircle, Send } from "lucide-react";
import { motion } from "motion/react";
import { useDebateSession } from "../../hooks/useDebateSession";
import { isValidPhone, formatPhone } from "../../utils/validation";
import { TOSText } from "../onboarding/TOSText";

type Step = "phone" | "code" | "success";

interface CertifyCardProps {
  onDismiss: () => void;
  onSuccess: () => void;
}

export function CertifyCard({ onDismiss, onSuccess }: CertifyCardProps) {
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
        setTimeout(onSuccess, 1500);
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
        <Shield className="w-5 h-5 text-emerald-600" />
        <span className="text-lg text-emerald-700">Certify Your Votes</span>
      </div>

      {step === "phone" && (
        <motion.div
          key="phone"
          className="flex flex-col"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 min-h-[100px] flex flex-col items-center justify-center space-y-3">
            <p className="text-base text-center text-muted-foreground max-w-sm">
              Add your phone number to verify your votes came from a real person — without revealing who you are.
            </p>
          </div>

          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                />
              </div>
              <Button onClick={handleSendCode} disabled={loading} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="pt-2 border-t border-emerald-200 space-y-2">
            <div className="text-center"><TOSText /></div>
          </div>
        </motion.div>
      )}

      {step === "code" && (
        <motion.div
          key="code"
          className="flex flex-col"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 min-h-[100px] flex flex-col items-center justify-center space-y-3">
            <h3 className="text-2xl text-center">Enter your code</h3>
            <p className="text-base text-center text-muted-foreground max-w-sm">
              We sent a verification code to {phone}.
            </p>
          </div>

          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="text-center tracking-widest"
                />
              </div>
              <Button onClick={handleVerify} disabled={loading} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="pt-2 border-t border-emerald-200">
            <p className="text-xs text-center text-emerald-700">
              <button
                className="hover:text-emerald-900 transition-colors"
                onClick={() => { setStep("phone"); setCode(""); setError(null); }}
              >
                ← Change number
              </button>
            </p>
          </div>
        </motion.div>
      )}

      {step === "success" && (
        <motion.div
          key="success"
          className="min-h-[100px] flex flex-col items-center justify-center space-y-4 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          >
            <CheckCircle className="w-14 h-14 text-emerald-500" />
          </motion.div>
          <div>
            <h3 className="text-2xl text-center">Results certified!</h3>
            <p className="text-base text-center text-muted-foreground mt-1">
              Your votes are now verified. Thank you!
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
}
