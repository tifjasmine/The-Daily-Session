const stripeApi = "https://api.stripe.com/v1/checkout/sessions";

const getBaseUrl = (event) => {
  const configured = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (configured) return configured.replace(/\/$/, "");

  const host = event.headers.host || "localhost:8888";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
};

export const handler = async (event) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const payload = event.body ? JSON.parse(event.body) : {};
  const plan = payload.plan === "annual" ? "annual" : "monthly";
  const priceId =
    plan === "annual"
      ? process.env.STRIPE_ANNUAL_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID || process.env.STRIPE_PRICE_ID;

  if (!secretKey || !priceId) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error:
          plan === "annual"
            ? "Missing STRIPE_SECRET_KEY or STRIPE_ANNUAL_PRICE_ID"
            : "Missing STRIPE_SECRET_KEY or STRIPE_MONTHLY_PRICE_ID"
      })
    };
  }

  const email = String(payload.email || "").trim();
  const baseUrl = getBaseUrl(event);

  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${baseUrl}/profile?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/signup?checkout=cancelled`,
    allow_promotion_codes: "true"
  });

  if (email) params.set("customer_email", email);

  const response = await fetch(stripeApi, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      statusCode: response.status,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Stripe checkout session failed",
        detail: data
      })
    };
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: data.url,
      sessionId: data.id
    })
  };
};
