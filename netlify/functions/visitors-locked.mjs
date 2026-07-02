const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_BASE_ID = "appQxIhwr00DmKBx5";
const DEFAULT_TABLE_NAME = "Visitors While Locked";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body)
});

const clean = (value) => String(value || "").trim();

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID;
  const table = process.env.AIRTABLE_LOCKED_VISITORS_TABLE_ID ||
    process.env.AIRTABLE_VISITORS_WHILE_LOCKED_TABLE_ID ||
    DEFAULT_TABLE_NAME;

  if (!token) return json(500, { error: "Missing AIRTABLE_TOKEN environment variable" });

  const payload = JSON.parse(event.body || "{}");
  const name = clean(payload.name) || "Site visitor";
  const email = clean(payload.email).toLowerCase();

  if (!email || !email.includes("@")) return json(400, { error: "Enter a valid email address." });

  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ records: [{ fields: { Name: name, Email: email } }] })
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      return json(response.status, {
        error: "Airtable visitor request failed",
        detail: result?.error?.message || result?.error || text
      });
    }

    return json(200, { ok: true, id: result.records?.[0]?.id || "" });
  } catch (error) {
    return json(500, {
      error: "Unable to save visitor",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
