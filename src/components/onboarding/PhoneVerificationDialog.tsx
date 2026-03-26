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
import { useDebateSession } from "../../hooks/useDebateSession";
import { VERIFY_TEXT } from "../../utils/constants/text";

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
        setError(response?.error || "Failed to send code");
        return;
      }

      setStep("verify-code");
    } catch (err) {
      console.error("Error sending code:", err);
      setError("Failed to send code. Please try again.");
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
        setError(response?.error || "Invalid code");
        return;
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error verifying code:", err);
      setError("Failed to verify code. Please try again.");
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
            Verify Your Phone Number
          </DialogTitle>
          <DialogDescription>
            {step === "enter-phone"
              ? VERIFY_TEXT
              : "Enter the verification code sent to your phone."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === "enter-phone" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Only US phone numbers are supported currently.
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
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Sent to {phoneNumber}
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
                  {loading ? "Verifying..." : "Verify Code"}
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
                  Change Phone Number
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}