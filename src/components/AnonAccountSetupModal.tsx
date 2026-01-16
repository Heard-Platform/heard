import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { Sparkles, Users, Award, Mail } from "lucide-react";
import { isValidEmail } from "../utils/validation";
import { useDebateSession } from "../hooks/useDebateSession";

interface AnonAccountSetupModalProps {
  featureText: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AnonAccountSetupModal({
  featureText,
  isOpen,
  onClose,
}: AnonAccountSetupModalProps) {
  const { sendMagicLink, verifyMagicLink } = useDebateSession();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicCode, setMagicCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  const handleSendMagicLink = async () => {
    const emailValid = isValidEmail(email.trim());
    if (!emailValid) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    setError("");
    const response = await sendMagicLink(email.trim());
    if (response && response.success) {
      setMagicLinkSent(true);
    } else {
      setError(response?.error || "Failed to send magic link");
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (magicCode.length !== 6) {
      return;
    }

    setVerifyingCode(true);
    setError("");
    const response = await verifyMagicLink(magicCode.toUpperCase());
    if (response && response.success) {
      window.location.reload();
    } else {
      setError(response?.error || "Invalid or expired code");
    }
    setVerifyingCode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0 bg-transparent">
        <DialogTitle className="sr-only">Setup Account</DialogTitle>
        <DialogDescription className="sr-only">
          Create an account to create discussions, explore communities, and get recognized for your contributions!
        </DialogDescription>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-1 rounded-lg"
        >
          <div className="bg-white dark:bg-gray-950 rounded-lg p-6 space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="relative flex justify-center"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full blur-lg opacity-50"
                />
                <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
            </motion.div>

            <div className="text-center space-y-2">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                Set up your account ✨
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground"
              >
                Hey there, new friend! To start {featureText}, just set up your account below.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-4"
            >
              <FeatureBadge icon={Sparkles} label="Start Discussions" />
              <FeatureBadge icon={Users} label="Explore Communities" />
              <FeatureBadge icon={Award} label="Get Recognized" />
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMagicLink();
              }}
              className="space-y-4"
            >
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
                      Check your email and click the link to complete setup
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
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="bg-white dark:bg-gray-900"
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll send you a magic link to complete setup
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
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1"
                    >
                      Maybe Later
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isValidEmail(email.trim()) || loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Magic Link
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.form>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30"
    >
      <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      <span className="text-xs text-center text-muted-foreground">
        {label}
      </span>
    </motion.div>
  );
}