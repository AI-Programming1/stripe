// server.js (minimal working example)
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // from Render env

app.use(cors());
app.use(express.json()); // for non-webhook routes

// create checkout session (uses PRICE_ID from env)
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.PRICE_ID, quantity: 1 }],
      customer_email: req.body.email,
      success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// webhook endpoint — must receive raw body for signature verification
app.post(
  "/webhook",
  express.raw({ type: "application/json" }), // raw body for Stripe verification
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // handle event types
    if (event.type === "checkout.session.completed") {
      // handle subscription start
    }
    res.json({ received: true });
  }
);

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
