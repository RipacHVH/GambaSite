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

// GET /api/stripe/verify-session?session_id=XXX
router.get("/verify-session", requireAuth, async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: "Missing session_id" });
  try {
    const s = stripe();
    const session = await s.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return res.json({ is_pro: false, status: session.payment_status });
    }
    const userId = parseInt(session.metadata?.userId);
    if (!userId) return res.status(400).json({ error: "No userId in session metadata" });
    await db.run("UPDATE users SET is_pro = 1, stripe_subscription_id = ? WHERE id = ?", [session.subscription, userId]);
    const user = await db.get("SELECT * FROM users WHERE id = ?", [userId]);
    res.json({ is_pro: Boolean(user.is_pro), user: { id: user.id, email: user.email, is_pro: Boolean(user.is_pro) } });
  } catch (err) {
    console.error("verify-session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/create-checkout-session
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return res.status(500).json({ error: "STRIPE_PRICE_ID not configured on server" });

  try {
    const s = stripe();
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await s.customers.create({
        email: user.email,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
      await db.run("UPDATE users SET stripe_customer_id = ? WHERE id = ?", [customerId, user.id]);
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

// POST /api/stripe/create-portal-session
router.post("/create-portal-session", requireAuth, async (req, res) => {
  try {
    const s = stripe();
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user.stripe_customer_id) return res.status(400).json({ error: "No active subscription found" });

    const origin = process.env.ALLOWED_ORIGIN || req.headers.origin || "http://localhost:5173";
    const session = await s.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${origin}/settings`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/webhook
export async function stripeWebhookHandler(req, res) {
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

  try {
    if (type === "checkout.session.completed") {
      const session = data.object;
      const userId = parseInt(session.metadata?.userId);
      if (userId) {
        await db.run("UPDATE users SET is_pro = 1, stripe_subscription_id = ? WHERE id = ?", [session.subscription, userId]);
        console.log(`User ${userId} upgraded to Pro`);
      }
    }

    if (type === "customer.subscription.deleted") {
      await db.run("UPDATE users SET is_pro = 0 WHERE stripe_subscription_id = ?", [data.object.id]);
      console.log(`Subscription ${data.object.id} cancelled — pro access revoked`);
    }

    if (type === "invoice.payment_failed") {
      const sub = data.object.subscription;
      if (sub) {
        await db.run("UPDATE users SET is_pro = 0 WHERE stripe_subscription_id = ?", [sub]);
        console.log(`Payment failed for subscription ${sub} — pro access revoked`);
      }
    }
  } catch (err) {
    console.error("Webhook db error:", err.message);
  }

  res.json({ received: true });
}
