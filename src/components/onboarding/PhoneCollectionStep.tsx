import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Phone } from "lucide-react";
import { motion } from "motion/react";
import { isValidPhone, formatPhone } from "../../utils/validation";
import { useDebateSession } from "../../hooks/useDebateSession";

interface PhoneCollectionStepProps {
  onSkip: () => void;
  onSuccess: () => void;
}

export function PhoneCollectionStep({
  onSkip,
  onSuccess,
}: PhoneCollectionStepProps) {
  const { sendSmsCode, verifySmsCode } = useDebateSession();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  const handleSendSMS = async () => {
    const phoneValid = isValidPhone(phone);
    if (!phoneValid) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await sendSmsCode(formatPhone(phone));
      if (response && response.success) {
        setSmsSent(true);
      } else {
        setError(response?.error || "Failed to send SMS code");
      }
    } catch (error) {
      console.error("Failed to send SMS:", error);
      setError("Failed to send SMS code");
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      return;
    }

    setVerifyingCode(true);
    setError("");
    try {
      const response = await verifySmsCode(formatPhone(phone), code);
      if (response && response.success) {
        onSuccess();
      } else {
        setError(response?.error || "Invalid or expired code");
      }
    } catch (error) {
      console.error("Failed to verify SMS code:", error);
      setError("Failed to verify code");
    }
    setVerifyingCode(false);
  };

  const handleGoBack = () => {
    setSmsSent(false);
    setCode("");
    setError("");
  };

  if (!smsSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
            <Phone className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-green-900 mb-1">
            You're in! 🎉
          </p>
          <p className="text-sm text-green-800">
            Secure your account with phone verification?
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm">
            Phone Number (Optional)
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            disabled={loading}
            className="bg-white dark:bg-gray-900"
          />
          <p className="text-xs text-muted-foreground">
            Verify your account and get notified about discussions
          </p>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            disabled={loading}
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            type="submit"
            disabled={!isValidPhone(phone) || loading}
            onClick={handleSendSMS}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-4 h-4 mr-2"
                >
                  <Phone className="w-4 h-4" />
                </motion.div>
                Sending Code...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Send Code
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
        <Phone className="w-8 h-8 mx-auto text-green-600 mb-2" />
        <p className="text-sm font-medium text-green-900">
          Code sent via SMS!
        </p>
        <p className="text-xs text-green-700 mt-1">
          Check your phone for the 6-digit code
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" className="text-xs text-center block">
          Enter the 6-digit code:
        </Label>
        <div className="flex gap-2">
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/[^0-9]/g, "").substring(0, 6));
            }}
            placeholder="123456"
            disabled={verifyingCode}
            className="text-center font-mono text-lg tracking-widest"
            maxLength={6}
          />
          <Button
            type="button"
            onClick={handleVerifyCode}
            disabled={code.length !== 6 || verifyingCode}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {verifyingCode ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-4 h-4 heard-spinner-white"
              />
            ) : (
              "Verify"
            )}
          </Button>
        </div>
        <button
          type="button"
          onClick={handleGoBack}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline w-full text-center"
        >
          Go back
        </button>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}