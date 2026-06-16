const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_BASE_ID = "appQxIhwr00DmKBx5";
const DEFAULT_TABLES = ["Studio Info 2", "Studio Info", "Studios"];

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

const splitLines = (value) =>
  getText(value)
    .split(/\r?\n|;/)
    .map((item) => item.replace(/^[-•→⇒]\s*/, "").trim())
    .filter(Boolean);

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
  String(value || fallback || "studio")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || String(fallback || "studio");

const mapRecord = (record) => {
  const fields = record.fields || {};
  const name = getText(
    getField(fields, ["Studio/Business Name", "Studio Name", "Business Name", "Name"])
  );
  const category = getText(getField(fields, ["Category", "Primary Category"]));
  const subcategories = getAllText(getField(fields, ["Subcategory", "Subcategories", "Class Types"]));
  const perk = getText(getField(fields, ["Member Perks", "Member Perk", "Discount", "Studio Perks"]));
  const descriptionFull = getText(
    getField(fields, ["Description Full", "Full Description", "Long Description", "About Full"])
  );
  const descriptionShort = getText(
    getField(fields, ["Description Short", "Description", "About", "Studio Description"])
  );
  const highlightsField = getField(fields, ["Class Highlights", "Studio Highlights", "Highlights"]);
  const highlights = getAllText(highlightsField);
  const classHighlights =
    highlights.length === 1 && /[\r\n;]/.test(highlights[0]) ? splitLines(highlightsField) : highlights;

  return {
    id: record.id,
    slug: slugify(getText(getField(fields, ["SEO:Slug", "Slug"])) || name, record.id),
    name: name || "Studio",
    category: category || "Studio",
    subcategory: subcategories.join(", "),
    subcategories,
    neighborhood: getText(getField(fields, ["Neighborhood", "Philadelphia Neighborhood"])),
    address: getText(getField(fields, ["Address", "Studio Address"])),
    description: descriptionShort || descriptionFull,
    descriptionFull: descriptionFull || descriptionShort,
    classHighlights,
    photo: getPhotoUrl(getField(fields, ["Photo", "Business Photo", "Studio Photo"])),
    website: getText(getField(fields, ["Website", "Studio Site", "Site"])),
    phone: getText(getField(fields, ["Phone", "Number"])),
    email: getText(getField(fields, ["Email"])),
    socialMedia: getText(getField(fields, ["Social Media", "Instagram", "Instagram handle"])),
    bookingLink: getText(getField(fields, ["Booking Link", "Booking URL", "Schedule URL", "Public Calendar Link"])),
    hours: getText(getField(fields, ["Hours", "Hours / Availability", "Schedule"])),
    priceRange: getText(getField(fields, ["Price Range", "Price Range per Class", "Drop in Rate"])),
    parking: getText(getField(fields, ["Parking", "Parking Info"])),
    accessibility: getText(getField(fields, ["Accessibility", "Access Info"])),
    visitType: getText(getField(fields, ["Visit Type", "Class Format"])),
    perk,
    hasPerk: Boolean(perk),
    upcoming: []
  };
};

const hasCompanyShape = (record) => {
  const fields = record.fields || {};
  return Boolean(
    getField(fields, ["Studio/Business Name", "Studio Name", "Business Name", "Name"]) ||
      getField(fields, ["SEO:Slug", "Description Short", "Member Perks"])
  );
};

const fetchRecords = async ({ baseId, table, token, viewId }) => {
  const records = [];
  let offset = "";

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (viewId) params.set("view", viewId);
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
      return { ok: false, status: response.status, detail, records: [] };
    }

    const page = await response.json();
    records.push(...(page.records || []));
    offset = page.offset || "";
  } while (offset);

  return { ok: true, status: 200, detail: "", records };
};

export const handler = async () => {
  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID;
  const preferredTable = process.env.AIRTABLE_COMPANIES_TABLE_ID || process.env.AIRTABLE_COMPANIES_TABLE;
  const viewId = process.env.AIRTABLE_COMPANIES_VIEW_ID || "";
  const tables = [...new Set([preferredTable, ...DEFAULT_TABLES].filter(Boolean))];

  if (!token) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Missing AIRTABLE_TOKEN environment variable" })
    };
  }

  try {
    const failures = [];

    for (const table of tables) {
      const result = await fetchRecords({ baseId, table, token, viewId });
      if (!result.ok) {
        failures.push(`${table}: ${result.status}`);
        continue;
      }

      const usable = result.records.filter(hasCompanyShape);
      if (!usable.length) {
        failures.push(`${table}: no studio fields`);
        continue;
      }

      const companies = usable.map(mapRecord).sort((a, b) => a.name.localeCompare(b.name));

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=60"
        },
        body: JSON.stringify({
          source: "airtable",
          table,
          count: companies.length,
          companies
        })
      };
    }

    return {
      statusCode: 404,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Unable to find a studio Airtable table",
        detail: failures.join("; ")
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Unable to load Airtable companies",
        detail: error instanceof Error ? error.message : String(error)
      })
    };
  }
};
