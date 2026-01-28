import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import {
  Mail,
  ArrowLeft,
  Sparkles,
  Phone,
} from "lucide-react";
import { isValidEmail } from "../utils/validation";
import { isValidPhone, formatPhone } from "../utils/validation";
import { useDebateSession } from "../hooks/useDebateSession";

interface NicknameSetupProps {
  loading: boolean;
  error: string;
  joiningRoom: boolean;
  onBack: () => void;
  onMagicLinkSuccess: () => void;
}

export function NicknameSetup({
  loading,
  error,
  joiningRoom,
  onBack,
  onMagicLinkSuccess,
}: NicknameSetupProps) {
  const { sendMagicLink, verifyMagicLink, sendSmsCode, verifySmsCode } = useDebateSession();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [magicCode, setMagicCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
  };

  const handleSendMagicLink = async () => {
    const emailValid = isValidEmail(email.trim());
    if (!emailValid) {
      return;
    }

    setSendingMagicLink(true);
    const response = await sendMagicLink(email.trim());
    if (response && response.success) {
      setMagicLinkSent(true);
    }
    setSendingMagicLink(false);
  };

  const handleSendSMS = async () => {
    const phoneValid = isValidPhone(phone);
    if (!phoneValid) {
      return;
    }

    setSendingMagicLink(true);
    try {
      const response = await sendSmsCode(formatPhone(phone));
      if (response && response.success) {
        setSmsSent(true);
      }
    } catch (error) {
      console.error("Failed to send SMS:", error);
    }
    setSendingMagicLink(false);
  };

  const handleVerifyCode = async () => {
    if (magicCode.length !== 6) {
      return;
    }

    setVerifyingCode(true);
    if (smsSent) {
      try {
        const response = await verifySmsCode(formatPhone(phone), magicCode);
        if (response && response.success) {
          onMagicLinkSuccess();
        }
      } catch (error) {
        console.error("Failed to verify SMS code:", error);
      }
    } else {
      const response = await verifyMagicLink(magicCode.toUpperCase());
      if (response && response.success) {
        onMagicLinkSuccess();
      }
    }
    setVerifyingCode(false);
  };

  const canSubmit = isValidEmail(email.trim()) || isValidPhone(phone);

  return (
    <div className="heard-page-bg heard-center p-4">
      <button
        onClick={onBack}
        disabled={loading}
        className="fixed top-4 left-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center space-y-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="heard-icon-circle"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-2xl font-bold">
              {joiningRoom
                ? "Join the Debate!"
                : "Welcome to Heard!"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {joiningRoom
                ? "Sign in with email or phone to join!"
                : "Sign in with email or phone to get started!"}
            </p>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-xs text-purple-900 leading-relaxed">
                Enter your email or phone number. We'll send you a code to verify it's you.
              </p>
            </div>
          </div>

          <div className="mt-2 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  handleEmailChange(e.target.value)
                }
                placeholder="you@example.com"
                disabled={loading || magicLinkSent || smsSent}
                autoComplete="email"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-xs text-gray-500 font-medium">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  handlePhoneChange(e.target.value)
                }
                placeholder="+1 (555) 123-4567"
                disabled={loading || magicLinkSent || smsSent}
                autoComplete="tel"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {(magicLinkSent || smsSent) ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
                  {magicLinkSent ? (
                    <Mail className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  ) : (
                    <Phone className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  )}
                  <p className="text-sm font-medium text-green-900">
                    {magicLinkSent ? "Code sent to your email!" : "Code sent via SMS!"}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {magicLinkSent
                      ? "Check your email for the 6-character code"
                      : "Check your phone for the 6-character code"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="magicCode" className="text-xs text-center block">
                    Enter the 6-character code:
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="magicCode"
                      type="text"
                      value={magicCode}
                      onChange={(e) => {
                        if (smsSent) {
                          setMagicCode(e.target.value.replace(/[^0-9]/g, "").substring(0, 6));
                        } else {
                          setMagicCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6));
                        }
                      }}
                      placeholder={smsSent ? "123456" : "ABC123"}
                      disabled={verifyingCode}
                      className="text-center font-mono text-lg tracking-widest uppercase"
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={magicCode.length !== 6 || verifyingCode}
                    >
                      {verifyingCode ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <Button
                type="button"
                className="w-full"
                disabled={
                  !canSubmit ||
                  loading ||
                  sendingMagicLink
                }
                onClick={canSubmit ? (isValidEmail(email.trim()) ? handleSendMagicLink : handleSendSMS) : undefined}
              >
                {sendingMagicLink ? (
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
                      {isValidEmail(email.trim()) ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                    </motion.div>
                    Sending Code...
                  </>
                ) : (
                  <>
                    {isValidEmail(email.trim()) ? (
                      <Mail className="w-4 h-4 mr-2" />
                    ) : (
                      <Phone className="w-4 h-4 mr-2" />
                    )}
                    {joiningRoom ? "Send Code & Join!" : "Send Me a Code"}
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}