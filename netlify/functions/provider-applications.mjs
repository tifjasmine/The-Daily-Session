const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_BASE_ID = "appQxIhwr00DmKBx5";
const DEFAULT_TABLE_NAME = "Providers List";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body)
});

const clean = (value) => String(value || "").trim();
const list = (value) => (Array.isArray(value) ? value.map(clean).filter(Boolean) : []);

const setField = (fields, names, value) => {
  if (value === undefined || value === null) return;
  if (Array.isArray(value) && !value.length) return;
  if (typeof value === "string" && !value.trim()) return;
  fields[names[0]] = value;
};

const createRecord = async ({ baseId, table, token, fields }) => {
  const remaining = { ...fields };

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ records: [{ fields: remaining }] })
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (response.ok) return result;

    const detail = result?.error?.message || result?.error || text;
    const unknownField = String(detail).match(/Unknown field name: \"([^\"]+)\"/)?.[1];
    if (!unknownField || remaining[unknownField] === undefined) {
      const error = new Error(detail || "Airtable provider application request failed");
      error.status = response.status;
      throw error;
    }

    delete remaining[unknownField];
  }

  throw new Error("Too many Airtable field names were not recognized.");
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID;
  const table = process.env.AIRTABLE_PROVIDER_APPLICATIONS_TABLE_ID ||
    process.env.AIRTABLE_PROVIDERS_TABLE_ID ||
    process.env.AIRTABLE_PROVIDERS_TABLE ||
    DEFAULT_TABLE_NAME;

  if (!token) return json(500, { error: "Missing AIRTABLE_TOKEN environment variable" });

  const payload = JSON.parse(event.body || "{}");
  const required = ["practitionerName", "email", "phone", "website", "businessName", "address", "hours", "aboutBusiness", "serviceDetails", "bookingLink", "signature"];
  const missing = required.filter((field) => !clean(payload[field]));

  if (missing.length) return json(400, { error: "Missing required provider application fields", missing });

  const fields = {};
  setField(fields, ["Practitioner Name"], clean(payload.practitionerName));
  setField(fields, ["Email"], clean(payload.email));
  setField(fields, ["Practitioner Email"], clean(payload.email));
  setField(fields, ["Number"], clean(payload.phone));
  setField(fields, ["Website"], clean(payload.website));
  setField(fields, ["Business Name"], clean(payload.businessName));
  setField(fields, ["Social Media"], clean(payload.instagram));
  setField(fields, ["Neighborhood"], list(payload.neighborhood));
  setField(fields, ["Address"], clean(payload.address));
  setField(fields, ["Hours / Availability"], clean(payload.hours));
  setField(fields, ["About The Business"], clean(payload.aboutBusiness));
  setField(fields, ["About The Practitioner"], clean(payload.aboutPractitioner));
  setField(fields, ["Provider Type"], clean(payload.providerType));
  setField(fields, ["Services"], list(payload.services));
  setField(fields, ["Additional Services"], clean(payload.additionalServices));
  setField(fields, ["Services Details"], clean(payload.serviceDetails));
  setField(fields, ["Insurance?"], clean(payload.acceptsInsurance));
  setField(fields, ["Insurance"], list(payload.insurances));
  setField(fields, ["Additional Insurance"], clean(payload.additionalInsurance));
  setField(fields, ["Payment Options"], list(payload.paymentOptions));
  setField(fields, ["Direct Booking Link"], clean(payload.bookingLink));
  setField(fields, ["Discount"], clean(payload.memberDiscount));
  setField(fields, ["Member Perk"], clean(payload.memberDiscount));
  setField(fields, ["Photo File Name"], clean(payload.photoName));
  setField(fields, ["Typed Signature"], clean(payload.signature));
  setField(fields, ["How did you hear about us?"], clean(payload.heardAbout));
  setField(fields, ["Notes"], clean(payload.notes));
  setField(fields, ["Status"], "Pending");

  try {
    const result = await createRecord({ baseId, table, token, fields });

    return json(200, { ok: true, id: result.records?.[0]?.id || "" });
  } catch (error) {
    return json(error.status || 500, {
      error: "Unable to save provider application",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
