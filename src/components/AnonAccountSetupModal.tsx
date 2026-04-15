import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { Sparkles, Users, Award, Mail, Phone } from "lucide-react";
import { isValidEmail, isValidPhone, formatPhone } from "../utils/validation";
import { useDebateSession } from "../hooks/useDebateSession";
import { PhoneCollectionStep } from "./onboarding/PhoneCollectionStep";
import { TOSText } from "./onboarding/TOSText";

// @ts-ignore
import { toast } from "sonner@2.0.3";

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
  const { sendMagicLink, verifyMagicLink, sendSmsCode, verifySmsCode, addEmailToAccount } = useDebateSession();
  const [showEmailFlow, setShowEmailFlow] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [magicCode, setMagicCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showOptionalEmailScreen, setShowOptionalEmailScreen] = useState(false);
  const [optionalEmail, setOptionalEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [showOptionalPhoneScreen, setShowOptionalPhoneScreen] = useState(false);

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
    if (magicCode.length !== 6) {
      return;
    }

    setVerifyingCode(true);
    setError("");
    if (smsSent) {
      try {
        const response = await verifySmsCode(formatPhone(phone), magicCode);
        if (response && response.success) {
          if (response.data?.user.email) {
            handleSuccessfulLogin();
          } else {
            setShowOptionalEmailScreen(true);
          }
        } else {
          setError(response?.error || "Invalid or expired code");
        }
      } catch (error) {
        console.error("Failed to verify SMS code:", error);
        setError("Failed to verify code");
      }
    } else {
      const response = await verifyMagicLink(magicCode.toUpperCase());
      if (response && response.success) {
        const userHasPhone = response.data?.user?.phoneVerified;
        if (!userHasPhone) {
          setShowOptionalPhoneScreen(true);
        } else {
          handleSuccessfulLogin();
        }
      } else {
        setError(response?.error || "Invalid or expired code");
      }
    }
    setVerifyingCode(false);
  };

  const handleSuccessfulLogin = () => {
    toast.success("Successfully signed in!");
    onClose();
  };

  const handleSaveEmail = async () => {
    const emailValid = isValidEmail(optionalEmail.trim());
    if (!emailValid) {
      setError("Please enter a valid email");
      return;
    }

    setSavingEmail(true);
    setError("");
    const response = await addEmailToAccount(optionalEmail.trim());
    if (response && response.success) {
      handleSuccessfulLogin();
    } else {
      setError(response?.error || "Failed to add email");
    }
    setSavingEmail(false);
  };

  const canSubmit = showEmailFlow ? isValidEmail(email.trim()) : isValidPhone(phone);
  const codeSent = showEmailFlow ? magicLinkSent : smsSent;
  const IconComponent = showEmailFlow ? Mail : Phone;

  const renderOptionalEmailScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
        <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
          <Mail className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-lg font-semibold text-green-900 mb-1">
          You're in! 🎉
        </p>
        <p className="text-sm text-green-800">
          Want to get updates about discussions you're involved in?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="optionalEmail" className="text-sm">
          Email (Optional)
        </Label>
        <Input
          id="optionalEmail"
          type="email"
          value={optionalEmail}
          onChange={(e) => setOptionalEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={savingEmail}
          className="bg-white dark:bg-gray-900"
        />
        <p className="text-xs text-muted-foreground">
          We'll only send you updates about discussions you participate in
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
          onClick={handleSuccessfulLogin}
          disabled={savingEmail}
          className="flex-1"
        >
          Skip
        </Button>
        <Button
          type="submit"
          disabled={!isValidEmail(optionalEmail.trim()) || savingEmail}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          {savingEmail ? (
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
              Saving...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Save Email
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

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
            {!showOptionalEmailScreen && !showOptionalPhoneScreen && (
              <>
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
                    Signup or Login ✨
                  </motion.h2>
                  {!codeSent && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-muted-foreground"
                    >
                      Hey there, new friend! To {featureText}, just enter your {showEmailFlow ? "email" : "phone number"} below.
                    </motion.p>
                  )}
                </div>

                {!codeSent && (
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
                )}
              </>
            )}

            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (showOptionalEmailScreen) {
                  handleSaveEmail();
                } else if (showEmailFlow) {
                  handleSendMagicLink();
                } else {
                  handleSendSMS();
                }
              }}
              className="space-y-4"
            >
              {showOptionalEmailScreen ? (
                renderOptionalEmailScreen()
              ) : showOptionalPhoneScreen ? (
                <PhoneCollectionStep
                  onSuccess={handleSuccessfulLogin}
                  onSkip={handleSuccessfulLogin}
                />
              ) : codeSent ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
                    <IconComponent className="w-8 h-8 mx-auto text-green-600 mb-2" />
                    <p className="text-sm font-medium text-green-900">
                      {showEmailFlow ? "Code sent to your email!" : "Code sent via SMS!"}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {showEmailFlow
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
                          if (showEmailFlow) {
                            setMagicCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6));
                          } else {
                            setMagicCode(e.target.value.replace(/[^0-9]/g, "").substring(0, 6));
                          }
                        }}
                        placeholder={showEmailFlow ? "ABC123" : "123456"}
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
                            className="w-4 h-4 heard-spinner-white"
                          />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMagicLinkSent(false);
                        setSmsSent(false);
                        setMagicCode("");
                        setError("");
                        setEmail("");
                        setPhone("");
                        setShowEmailFlow(false);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline w-full text-center"
                    >
                      Go back
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={showEmailFlow ? "email" : "phone"}>
                      {showEmailFlow ? "Email" : "Phone Number"}
                    </Label>
                    {showEmailFlow ? (
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={loading}
                        className="bg-white dark:bg-gray-900"
                      />
                    ) : (
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        disabled={loading}
                        className="bg-white dark:bg-gray-900"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {showEmailFlow
                        ? "We'll send you a code to verify your email"
                        : "We'll send you a code to verify your phone"}
                    </p>
                    <TOSText />
                    {showEmailFlow ? (
                      <button
                        type="button"
                        onClick={() => setShowEmailFlow(false)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                      >
                        Use phone instead
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowEmailFlow(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                      >
                        Use email instead (legacy users)
                      </button>
                    )}
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
                      disabled={!canSubmit || loading}
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
                            <IconComponent className="w-4 h-4" />
                          </motion.div>
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <IconComponent className="w-4 h-4 mr-2" />
                          Send Code
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