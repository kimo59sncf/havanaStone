/* ============================================================
   HAVANA STONES — Node.js server (static + Stripe Checkout API)
   ============================================================ */
require("dotenv").config();

const express = require("express");
const path = require("path");
const Stripe = require("stripe");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY environment variable is not set.");
  process.exit(1);
}
const stripe = Stripe(STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

/* ---------- Create a Stripe Checkout Session ---------- */
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in cart." });
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name || "Natural Stone",
        },
        unit_amount: Math.round((item.price || 0) * 100),
      },
      quantity: Math.max(1, parseInt(item.qty, 10) || 1),
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/products.html`,
      billing_address_collection: "auto",
      customer_creation: "always",
      invoice_creation: {
        enabled: true,
      },
      metadata: {
        source: "havana-stones-website",
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- Stripe webhook (payment confirmation) ---------- */
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    if (STRIPE_WEBHOOK_SECRET) {
      const sig = req.headers["stripe-signature"];
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      event = JSON.parse(req.body.toString());
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Payment succeeded for session:", session.id);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        console.log("Invoice paid:", invoice.id);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

/* ---------- Serve static site ---------- */
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Havana Stones server running on port ${PORT}`);
  console.log(`Base URL: ${BASE_URL}`);
});