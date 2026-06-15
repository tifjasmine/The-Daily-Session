import { upsertMember } from "./airtable-members.mjs";

export const handler = async (event) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const sessionId = event.queryStringParameters?.session_id || "";

  if (!secretKey) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" })
    };
  }

  if (!sessionId) {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Missing session_id" })
    };
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: {
        authorization: `Bearer ${secretKey}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return {
      statusCode: response.status,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Stripe verification failed",
        detail: data
      })
    };
  }

  const paid = data.payment_status === "paid" || data.status === "complete";
  const email = data.customer_details?.email || data.customer_email || "";
  let member = null;

  if (paid && email) {
    member = await upsertMember({
      email,
      paid: true,
      membershipType: data.subscription ? "Stripe Membership" : "Stripe",
      stripeCustomerId: data.customer || "",
      stripeSubscriptionId: data.subscription || ""
    });
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      paid,
      email,
      customerId: data.customer || "",
      subscriptionId: data.subscription || "",
      member
    })
  };
};
