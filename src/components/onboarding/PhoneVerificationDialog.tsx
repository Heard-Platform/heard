import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Smartphone, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDebateSession } from "../../hooks/useDebateSession";

interface PhoneVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "enter-phone" | "verify-code";

export function PhoneVerificationDialog({
  open,
  onClose,
  onSuccess,
}: PhoneVerificationDialogProps) {
  const { t } = useTranslation("account");
  const { sendSmsCode, addPhoneToAccount } = useDebateSession();
  const [step, setStep] = useState<Step>("enter-phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await sendSmsCode(phoneNumber);

      if (!response || !response.success) {
        setError(response?.error || t("errSendCode"));
        return;
      }

      setStep("verify-code");
    } catch (err) {
      console.error("Error sending code:", err);
      setError(t("errSendCodeRetry"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await addPhoneToAccount(phoneNumber, code);

      if (!response || !response.success) {
        setError(response?.error || t("errInvalidCodeShort"));
        return;
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error verifying code:", err);
      setError(t("errVerifyRetry"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("enter-phone");
    setPhoneNumber("");
    setCode("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            {t("verifyPhoneTitle")}
          </DialogTitle>
          <DialogDescription>
            {step === "enter-phone"
              ? t("verifyText")
              : t("verifyEnterCodeDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === "enter-phone" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phoneLabel")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  {t("usPhoneOnly")}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleSendCode}
                disabled={loading || !phoneNumber}
                className="w-full"
              >
                {loading ? t("sending") : t("sendVerificationCode")}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">{t("verificationCodeLabel")}</Label>
                <Input
                  id="code"
                  type="text"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  {t("sentToPhone", { phone: phoneNumber })}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={handleVerifyCode}
                  disabled={loading || !code}
                  className="w-full"
                >
                  {loading ? t("verifying") : t("verifyCode")}
                </Button>
                <Button
                  onClick={() => {
                    setStep("enter-phone");
                    setCode("");
                    setError("");
                  }}
                  variant="ghost"
                  disabled={loading}
                  className="w-full"
                >
                  {t("changePhoneNumber")}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}