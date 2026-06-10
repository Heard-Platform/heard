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
  `${API_URL_PREFIX}/create-payment-intent`,
  defineRoute(
    {
      amount: {
        type: "number",
        required: true,
        validate: (val) => val >= 1,
        errorMessage: "Amount must be at least $1",
      },
      mode: {
        type: "string",
        required: false,
      },
    },
    async ({ amount, mode }: { amount: number; mode?: string }) => {
      const stripeMode = mode === "live" ? "live" : "test";
      const stripe = getStripe(stripeMode);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: { source: "heard-funding-page" },
      });
      return { clientSecret: paymentIntent.client_secret };
    },
  ),
);
