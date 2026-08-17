/* ============================================================
   HAVANA STONES — Node.js server (static + Stripe Checkout API)
   ============================================================ */
require("dotenv").config();

const express = require("express");
const path = require("path");
const Stripe = require("stripe");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- Email transporter ---------- */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.amen.fr",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE !== "false", // true for 465
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const EMAIL_FROM = process.env.SMTP_FROM || "info@havana-stone.com";
const EMAIL_TO = process.env.SMTP_TO || "info@havana-stone.com";

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

    // Build Stripe line items from the cart.
    // Each item: { name, price (€/m²), qty (m²) }
    const line_items = items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name || "Natural Stone",
        },
        // Stripe expects the amount in the smallest currency unit (cents)
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
      // Collect billing address + email for invoicing
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

/* ---------- Stripe webhook (payment confirmation) ----------
   Optional but recommended for production: use this to mark
   orders as paid and trigger fulfilment. Requires the webhook
   signing secret (whsec_...) from the Stripe Dashboard.
   ---------------------------------------------------------- */
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
      // No signing secret configured — parse raw body manually (test only)
      event = JSON.parse(req.body.toString());
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Payment succeeded for session:", session.id);
        // TODO: trigger order fulfilment / send confirmation email here
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

/* ---------- Contact form -> email (fire-and-forget) ---------- */
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required." });
  }

  // Respond immediately, send email in background
  res.json({ success: true });

  transporter.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    replyTo: email,
    subject: `Havana Stones — New message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `<h3>New contact form submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, "<br>")}</p>`,
  }).catch((err) => console.error("Contact email error:", err));
});

/* ---------- Quote form -> email (fire-and-forget) ---------- */
app.post("/api/quote", (req, res) => {
  const { name, email, phone, type, material, usage, surface, message } = req.body;
  if (!name || !email || !type || !message) {
    return res.status(400).json({ error: "Required fields missing." });
  }

  // Respond immediately, send email in background
  res.json({ success: true });

  transporter.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    replyTo: email,
    subject: `Havana Stones — Quote request from ${name}`,
    text: `Name: ${name}
Email: ${email}
Phone: ${phone || "—"}
Project Type: ${type}
Material: ${material || "—"}
Usage: ${usage || "—"}
Surface: ${surface ? surface + " m²" : "—"}

Project Details:
${message}`,
    html: `<h3>New quote request</h3>
<table style="border-collapse:collapse;">
<tr><td><strong>Name</strong></td><td>${name}</td></tr>
<tr><td><strong>Email</strong></td><td>${email}</td></tr>
<tr><td><strong>Phone</strong></td><td>${phone || "—"}</td></tr>
<tr><td><strong>Project Type</strong></td><td>${type}</td></tr>
<tr><td><strong>Material</strong></td><td>${material || "—"}</td></tr>
<tr><td><strong>Usage</strong></td><td>${usage || "—"}</td></tr>
<tr><td><strong>Surface</strong></td><td>${surface ? surface + " m²" : "—"}</td></tr>
</table>
<h4>Project Details</h4>
<p>${message.replace(/\n/g, "<br>")}</p>`,
  }).catch((err) => console.error("Quote email error:", err));
});

/* ---------- Serve static site ---------- */
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Havana Stones server running on port ${PORT}`);
  console.log(`Base URL: ${BASE_URL}`);
});
