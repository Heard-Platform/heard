// @ts-ignore
import { Hono } from "npm:hono";
// @ts-ignore
import Stripe from "npm:stripe";
import { defineRoute } from "./route-wrapper.tsx";
import { API_URL_PREFIX } from "./constants.tsx";
import { createClientFromEnv } from "./db-utils.ts";

export const stripeApi = new Hono();
export const stripePublicApi = new Hono();

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

stripePublicApi.post(`${API_URL_PREFIX}/stripe-webhook`, async (c) => {
  const sig = c.req.header("stripe-signature");
  if (!sig) return c.json({ error: "Missing stripe-signature header" }, 400);

  const rawBody = await c.req.text();

  // Determine mode from the event payload before verifying, to pick the right secret
  let parsedEvent: any;
  try {
    parsedEvent = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const isLive = parsedEvent?.livemode === true;
  const secret = isLive
    ? Deno.env.get("STRIPE_WEBHOOK_SECRET_LIVE")
    : Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST");

  if (!secret) {
    return c.json({ error: `STRIPE_WEBHOOK_SECRET_${isLive ? "LIVE" : "TEST"} not set` }, 500);
  }

  const stripe = getStripe(isLive ? "live" : "test");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err: any) {
    return c.json({ error: `Webhook signature verification failed: ${err.message}` }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      const supabase = createClientFromEnv();
      const { error } = await supabase.from("donations").insert({
        stripeSessionId: session.id,
        amount: Math.round((session.amount_total ?? 0) / 100),
        mode: isLive ? "live" : "test",
      });
      if (error && error.code !== "23505") {
        // 23505 = unique_violation (duplicate webhook), safe to ignore
        console.error("Failed to insert donation:", error);
        return c.json({ error: "DB insert failed" }, 500);
      }
    }
  }

  return c.json({ received: true });
});
