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
} from "lucide-react";
import { isValidEmail } from "../utils/validation";
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
  const { sendMagicLink, verifyMagicLink } = useDebateSession();
  const [email, setEmail] = useState("");
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicCode, setMagicCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
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

  const handleVerifyCode = async () => {
    if (magicCode.length !== 6) {
      return;
    }

    setVerifyingCode(true);
    const response = await verifyMagicLink(magicCode.toUpperCase());
    if (response && response.success) {
      onMagicLinkSuccess();
    }
    setVerifyingCode(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
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
              className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
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
                ? "Enter your email to join this debate!"
                : "Enter your email to get started!"}
            </p>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-xs text-purple-900 leading-relaxed">
                We'll email you a magic link to sign in or create your account.
                You can also copy the code from the email and paste it here to continue.
              </p>
            </div>
          </div>

          <div className="mt-2 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  handleEmailChange(e.target.value)
                }
                placeholder="Enter your email..."
                disabled={loading || magicLinkSent}
                autoComplete="email"
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

            {magicLinkSent ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
                  <Mail className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-sm font-medium text-green-900">
                    Magic link sent!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Check your email and click the link to sign in
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="magicCode" className="text-xs text-center block">
                    Or enter the 6-character code from your email:
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="magicCode"
                      type="text"
                      value={magicCode}
                      onChange={(e) => setMagicCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6))}
                      placeholder="ABC123"
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
                  !isValidEmail(email.trim()) ||
                  loading ||
                  sendingMagicLink
                }
                onClick={handleSendMagicLink}
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
                      <Mail className="w-4 h-4" />
                    </motion.div>
                    Sending Magic Link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {joiningRoom ? "Send Magic Link & Join!" : "Send Me a Magic Link"}
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