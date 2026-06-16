import express from "express";
import Stripe from "stripe";
import db from "./db.mjs";
import { requireAuth } from "./authRouter.mjs";

export const router = express.Router();

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2024-04-10" });
}

// POST /api/stripe/create-checkout-session
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return res.status(500).json({ error: "STRIPE_PRICE_ID not configured on server" });

  try {
    const s = stripe();
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await s.customers.create({
        email: user.email,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
      db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(customerId, user.id);
    }

    const origin = process.env.ALLOWED_ORIGIN || req.headers.origin || "http://localhost:5173";

    const session = await s.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?pro_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?cancelled=1`,
      metadata: { userId: String(user.id) },
      subscription_data: { metadata: { userId: String(user.id) } },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/webhook — must be registered BEFORE express.json()
export function stripeWebhookHandler(req, res) {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET not configured" });

  let event;
  try {
    event = stripe().webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const { type, data } = event;

  if (type === "checkout.session.completed") {
    const session = data.object;
    const userId = parseInt(session.metadata?.userId);
    if (userId) {
      db.prepare("UPDATE users SET is_pro = 1, stripe_subscription_id = ? WHERE id = ?")
        .run(session.subscription, userId);
      console.log(`User ${userId} upgraded to Pro`);
    }
  }

  if (type === "customer.subscription.deleted") {
    const sub = data.object;
    db.prepare("UPDATE users SET is_pro = 0 WHERE stripe_subscription_id = ?").run(sub.id);
    console.log(`Subscription ${sub.id} cancelled — pro access revoked`);
  }

  if (type === "invoice.payment_failed") {
    const invoice = data.object;
    const sub = invoice.subscription;
    if (sub) {
      db.prepare("UPDATE users SET is_pro = 0 WHERE stripe_subscription_id = ?").run(sub);
      console.log(`Payment failed for subscription ${sub} — pro access revoked`);
    }
  }

  res.json({ received: true });
}
