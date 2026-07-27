import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Users, Award, Mail, Phone } from "lucide-react";
import { isValidEmail, isValidPhone, formatPhone } from "../utils/validation";
import { useDebateSession } from "../hooks/useDebateSession";
import { PhoneCollectionStep } from "./onboarding/PhoneCollectionStep";
import { TOSText } from "./onboarding/TOSText";

// @ts-ignore
import { toast } from "sonner@2.0.3";

export type AccountSetupReason =
  | "createPost"
  | "saveProgress"
  | "vote"
  | "certifyVotes"
  | "respond"
  | "createCommunity";

const PROMPT_KEY = {
  createPost: "promptCreatePost",
  saveProgress: "promptSaveProgress",
  vote: "promptVote",
  certifyVotes: "promptCertifyVotes",
  respond: "promptRespond",
  createCommunity: "promptCreateCommunity",
} as const;

interface AnonAccountSetupModalProps {
  reason: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AnonAccountSetupModal({
  reason,
  isOpen,
  onClose,
}: AnonAccountSetupModalProps) {
  const { t } = useTranslation(["account", "toast"]);
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
      setError(t("errInvalidEmail"));
      return;
    }

    setLoading(true);
    setError("");
    const response = await sendMagicLink(email.trim());
    if (response && response.success) {
      setMagicLinkSent(true);
    } else {
      setError(response?.error || t("errMagicLinkFailed"));
    }
    setLoading(false);
  };

  const handleSendSMS = async () => {
    const phoneValid = isValidPhone(phone);
    if (!phoneValid) {
      setError(t("errInvalidPhone"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await sendSmsCode(formatPhone(phone));
      if (response && response.success) {
        setSmsSent(true);
      } else {
        setError(response?.error || t("errSmsFailed"));
      }
    } catch (error) {
      console.error("Failed to send SMS:", error);
      setError(t("errSmsFailed"));
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
          setError(response?.error || t("errInvalidCode"));
        }
      } catch (error) {
        console.error("Failed to verify SMS code:", error);
        setError(t("errVerifyFailed"));
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
        setError(response?.error || t("errInvalidCode"));
      }
    }
    setVerifyingCode(false);
  };

  const handleSuccessfulLogin = () => {
    toast.success(t("toast:signedIn"));
    onClose();
  };

  const handleSaveEmail = async () => {
    const emailValid = isValidEmail(optionalEmail.trim());
    if (!emailValid) {
      setError(t("errInvalidEmail"));
      return;
    }

    setSavingEmail(true);
    setError("");
    const response = await addEmailToAccount(optionalEmail.trim());
    if (response && response.success) {
      handleSuccessfulLogin();
    } else {
      setError(response?.error || t("errAddEmailFailed"));
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
          {t("youreIn")}
        </p>
        <p className="text-sm text-green-800">
          {t("wantUpdates")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="optionalEmail" className="text-sm">
          {t("emailOptional")}
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
          {t("emailUpdatesNote")}
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
          {t("skip")}
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
              {t("saving")}
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              {t("saveEmail")}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0 bg-transparent">
        <DialogTitle className="sr-only">{t("srTitle")}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("srDescription")}
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
                    {t("signupOrLogin")}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-muted-foreground"
                  >
                    {t(PROMPT_KEY[reason as AccountSetupReason] ?? "promptCreatePost", {
                      contact: showEmailFlow ? t("contactEmail") : t("contactPhone"),
                    })}
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-4"
                >
                  <FeatureBadge icon={Sparkles} label={t("badgeStartDiscussions")} />
                  <FeatureBadge icon={Users} label={t("badgeExploreCommunities")} />
                  <FeatureBadge icon={Award} label={t("badgeGetRecognized")} />
                </motion.div>
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
                      {showEmailFlow ? t("codeSentEmail") : t("codeSentSms")}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {showEmailFlow ? t("checkEmailCode") : t("checkPhoneCode")}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="magicCode" className="text-xs text-center block">
                      {t("enterCode")}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="magicCode"
                        type="text"
                        autoComplete="one-time-code"
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
                          t("verify")
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
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline w-full text-center"
                    >
                      {t("goBack")}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={showEmailFlow ? "email" : "phone"}>
                      {showEmailFlow ? t("emailLabel") : t("phoneLabel")}
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
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        disabled={loading}
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {showEmailFlow ? t("sendCodeEmailNote") : t("sendCodePhoneNote")}
                    </p>
                    <TOSText />
                    {showEmailFlow ? (
                      <button
                        type="button"
                        onClick={() => setShowEmailFlow(false)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                      >
                        {t("usePhoneInstead")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowEmailFlow(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                      >
                        {t("useEmailInstead")}
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
                      {t("maybeLater")}
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
                          {t("sendingCode")}
                        </>
                      ) : (
                        <>
                          <IconComponent className="w-4 h-4 mr-2" />
                          {t("sendCode")}
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
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-purple-100">
      <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      <span className="text-xs text-center text-muted-foreground">
        {label}
      </span>
    </div>
  );
}