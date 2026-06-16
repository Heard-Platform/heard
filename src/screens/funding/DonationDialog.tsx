import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { api } from "../../utils/api";
import type { ApiResponse } from "../../utils/api-client";
import { C } from "./constants";

interface DonationDialogProps {
  open: boolean;
  amount: number;
  createCheckoutSession?: (amount: number, successUrl: string, cancelUrl: string) => Promise<ApiResponse<{ url: string }>>;
  onSuccess?: () => void;
  onClose: () => void;
}

export function DonationDialog({
  open,
  amount,
  createCheckoutSession = (amount, successUrl, cancelUrl) => api.createCheckoutSession(amount, successUrl, cancelUrl),
  onSuccess,
  onClose,
}: DonationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setError(null); setLoading(false); return; }
    setLoading(true);
    setError(null);

    const successUrl = `${window.location.origin}${window.location.pathname}?payment=success&amount=${amount}`;
    const cancelUrl = `${window.location.origin}${window.location.pathname}`;

    createCheckoutSession(amount, successUrl, cancelUrl)
      .then((res) => {
        if (res.success && res.data?.url) {
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.href = res.data.url;
          }
        } else {
          setError(res.error ?? "Failed to start checkout");
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Network error. Please try again.");
        setLoading(false);
      });
  }, [open, amount]);

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogTitle style={{ display: "none" }}>Redirecting to checkout</DialogTitle>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "24px 0" }}>
          {loading && !error && (
            <>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
              <p style={{ color: C.slate600, fontSize: 16 }}>Redirecting to Stripe...</p>
            </>
          )}
          {error && (
            <>
              <p style={{ color: C.red500, fontSize: 14, marginBottom: 16 }}>{error}</p>
              <button
                onClick={onClose}
                style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: C.slate200, color: C.slate700, cursor: "pointer", fontWeight: 600 }}
              >
                Close
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
