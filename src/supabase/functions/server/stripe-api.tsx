// @ts-ignore
import { Hono } from "npm:hono";
// @ts-ignore
import Stripe from "npm:stripe";
import { defineRoute } from "./route-wrapper.tsx";
import { API_URL_PREFIX } from "./constants.tsx";

export const stripeApi = new Hono();

const getStripe = (mode: "test" | "live") => {
  const key = mode === "live"
    ? Deno.env.get("STRIPE_SECRET_KEY_LIVE")
    : Deno.env.get("STRIPE_SECRET_KEY_TEST");
  if (!key) throw new Error(`STRIPE_SECRET_KEY_${mode.toUpperCase()} not set`);
  return new Stripe(key, { apiVersion: "2024-06-20" });
};

stripeApi.post(
  `${API_URL_PREFIX}/create-checkout-session`,
  defineRoute(
    {
      amount: {
        type: "number",
        required: true,
        validate: (val) => val >= 1,
        errorMessage: "Amount must be at least $1",
      },
      mode: { type: "string", required: false },
      successUrl: { type: "string", required: true },
      cancelUrl: { type: "string", required: true },
    },
    async ({ amount, mode, successUrl, cancelUrl }: { amount: number; mode?: string; successUrl: string; cancelUrl: string }) => {
      const stripeMode = mode === "live" ? "live" : "test";
      const stripe = getStripe(stripeMode);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "Donation to Heard" },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { source: "heard-funding-page" },
      });
      return { url: session.url };
    },
  ),
);
