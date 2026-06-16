const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_BASE_ID = "appQxIhwr00DmKBx5";
const DEFAULT_TABLE_NAME = "Providers List";

const getText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    return value.map(getText).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    return value.name || value.label || value.value || value.text || value.title || value.url || "";
  }

  return "";
};

const getAllText = (value) => {
  if (value === null || value === undefined) return [];
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.map(getText).filter(Boolean);
  return [getText(value)].filter(Boolean);
};

const getFirstText = (value) => getAllText(value)[0] || "";

const getPhotoUrl = (value) => {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === "object" && first.url) return first.url;
  }

  return "";
};

const getField = (fields, names) => {
  for (const name of names) {
    if (fields[name] !== undefined) return fields[name];
  }

  return "";
};

const slugify = (value, fallback) =>
  String(value || fallback || "provider")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || String(fallback || "provider");

const mapRecord = (record) => {
  const fields = record.fields || {};
  const businessName = getText(getField(fields, ["Business Name", "Business or practice name"]));
  const services = getAllText(getField(fields, ["Services", "Services offered"]));
  const providerType = getFirstText(getField(fields, ["Provider Type"]));
  const neighborhood = getFirstText(getField(fields, ["Neighborhood", "Philadelphia neighborhood"]));
  const discount = getText(getField(fields, ["Discount", "Member Discount", "Member Perk"]));

  return {
    id: record.id,
    slug: slugify(businessName, record.id),
    businessName: businessName || "Provider",
    practitionerName: getText(getField(fields, ["Practitioner Name", "Your Full Name"])),
    email: getText(getField(fields, ["Practitioner Email", "Email", "Email address"])),
    phone: getText(getField(fields, ["Number", "Phone", "Phone number"])),
    website: getText(getField(fields, ["Website"])),
    socialMedia: getText(getField(fields, ["Social Media", "Instagram handle"])),
    providerType,
    neighborhood,
    businessPhoto: getPhotoUrl(getField(fields, ["Business Photo", "Photo"])),
    services,
    shortDescription: getText(getField(fields, ["Short Description", "About The Business"])),
    aboutBusiness: getText(getField(fields, ["About The Business", "Tell us about your practice"])),
    aboutPractitioner: getText(getField(fields, ["About The Practitioner", "Tell us about yourself"])),
    serviceDetails: getText(getField(fields, ["Services Details", "About your services"])),
    address: getText(getField(fields, ["Address"])),
    hours: getText(getField(fields, ["Hours / Availability", "Hours"])),
    insurance: getAllText(getField(fields, ["Insurance?", "Insurance"])),
    paymentOptions: getAllText(getField(fields, ["Payment Options"])),
    bookingLink: getText(getField(fields, ["Direct Booking Link", "Booking Link"])),
    discount: discount || "$20 member credit",
    hasDiscount: Boolean(discount || businessName)
  };
};

export const handler = async () => {
  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID;
  const table = process.env.AIRTABLE_PROVIDERS_TABLE_ID || process.env.AIRTABLE_PROVIDERS_TABLE || DEFAULT_TABLE_NAME;
  const viewId = process.env.AIRTABLE_PROVIDERS_VIEW_ID || "";

  if (!token) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Missing AIRTABLE_TOKEN environment variable" })
    };
  }

  try {
    const records = [];
    let offset = "";

    do {
      const params = new URLSearchParams({ pageSize: "100" });
      if (viewId) params.set("view", viewId);
      params.append("sort[0][field]", "Business Name");
      params.append("sort[0][direction]", "asc");
      if (offset) params.set("offset", offset);

      const response = await fetch(
        `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}?${params.toString()}`,
        {
          headers: {
            authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const detail = await response.text();
        return {
          statusCode: response.status,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Airtable providers request failed", detail })
        };
      }

      const page = await response.json();
      records.push(...(page.records || []));
      offset = page.offset || "";
    } while (offset);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=60"
      },
      body: JSON.stringify({
        source: "airtable",
        count: records.length,
        providers: records.map(mapRecord)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Unable to load Airtable providers",
        detail: error instanceof Error ? error.message : String(error)
      })
    };
  }
};
