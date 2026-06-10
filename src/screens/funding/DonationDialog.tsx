import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { api } from "../../utils/api";
import alexImg from "figma:asset/alex-pointing.png";
import { C, stripePromise } from "./constants";

function DonationForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Something went wrong");
      setSubmitting(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <p style={{ color: C.red500, fontSize: 13, marginTop: 8 }}>{error}</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!stripe || submitting}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "16px 0",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 18,
          border: "none",
          cursor: !stripe || submitting ? "not-allowed" : "pointer",
          opacity: !stripe || submitting ? 0.6 : 1,
          background: "linear-gradient(135deg, #059669, #0d9488)",
          color: "white",
        }}
      >
        {submitting ? "Processing..." : `Donate $${amount}`}
      </button>
    </div>
  );
}

interface DonationDialogProps {
  open: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function DonationDialog({ open, amount, onClose, onSuccess }: DonationDialogProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setLoadError(null);
      return;
    }
    setClientSecret(null);
    setLoadError(null);
    api.createPaymentIntent(amount)
      .then((res) => {
        if (res.success && res.data?.clientSecret) setClientSecret(res.data.clientSecret);
        else setLoadError(res.error ?? "Failed to initialize payment");
      })
      .catch(() => setLoadError("Network error. Please try again."));
  }, [open, amount]);

  const handleSuccess = () => {
    setSucceeded(true);
    setTimeout(() => {
      onSuccess();
    }, 2200);
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o && !succeeded) onClose(); }}>
      <DialogContent>
        <DialogTitle style={{ display: "none" }}>Complete Donation</DialogTitle>

        {!succeeded ? (
          <div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
              <img
                src={alexImg}
                alt="Alex"
                style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.emerald100}`, marginBottom: 12 }}
              />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.slate800, marginBottom: 4 }}>
                Donate ${amount} to Heard
              </h2>
              <p style={{ color: C.slate500, fontSize: 14, lineHeight: 1.5 }}>
                You're charged immediately. Thank you.
              </p>
            </div>

            {loadError && (
              <p style={{ color: C.red500, fontSize: 14, textAlign: "center", marginBottom: 16 }}>{loadError}</p>
            )}

            {!loadError && !clientSecret && (
              <div style={{ textAlign: "center", padding: "24px 0", color: C.slate400, fontSize: 14 }}>
                Loading payment form...
              </div>
            )}

            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "stripe" } }}
              >
                <DonationForm amount={amount} onSuccess={handleSuccess} />
              </Elements>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 0" }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              style={{ fontSize: 56, marginBottom: 16 }}
            >
              🎉
            </motion.div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.slate800, marginBottom: 12 }}>
              Thank you so much!
            </h2>
            <p style={{ color: C.slate600, lineHeight: 1.625 }}>
              Your donation of <strong>${amount}</strong> means the world. I'll keep building.
            </p>
            <p style={{ color: C.slate500, fontSize: 14, marginTop: 16 }}>— Alex</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
