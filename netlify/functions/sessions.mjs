const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_BASE_ID = "appQxIhwr00DmKBx5";
const DEFAULT_TABLE_ID = "tblGTqTTdAlPPVXm0";
const DEFAULT_WINDOW_DAYS = "60";

const fieldNames = [
  "Start Time (NEW)",
  "Category",
  "Class Name",
  "Studio/Business Name (from Studio Info 2)",
  "Neighborhood",
  "Subcategory",
  "Description",
  "Address",
  "Reminder",
  "Google Calendar Link",
  "Level",
  "Drop in Rate",
  "Price Bracket",
  "Tags",
  "Mood Matcher",
  "Energy Level",
  "Outcome/Benefit",
  "Photo",
  "Sign Up Link",
  "Studio Site",
  "Start",
  "Status",
  "Record ID"
];

const getFirstString = (value) => {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim());
    return first || "";
  }

  if (typeof value === "string") return value;

  return "";
};

const getLabel = (value) => {
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      return first.label || first.name || first.value || "";
    }
  }

  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    return value.label || value.name || value.value || "";
  }

  return "";
};

const getPhotoUrl = (value) => {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === "object" && first.url) return first.url;
  }

  return "";
};

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

const mapRecord = (record) => {
  const fields = record.fields || {};
  const start = fields.Start || fields["Start Time (NEW)"];
  const signUpLink = fields["Sign Up Link"] || fields["Studio Site"];

  return {
    id: record.id,
    recordId: getFirstString(fields["Record ID"]) || record.id,
    title: fields["Class Name"] || "Untitled Class",
    studio: getFirstString(fields["Studio/Business Name (from Studio Info 2)"]) || "Studio",
    category: getLabel(fields.Category) || "Class",
    subcategory: getText(fields.Subcategory),
    neighborhood: getLabel(fields.Neighborhood),
    address: getText(fields.Address),
    description: getText(fields.Description),
    reminder: getText(fields.Reminder),
    googleCalendarLink: getFirstString(fields["Google Calendar Link"]),
    level: getText(fields.Level),
    dropInRate: getText(fields["Drop in Rate"]),
    priceBracket: getText(fields["Price Bracket"]),
    tags: getText(fields.Tags),
    moodMatcher: getText(fields["Mood Matcher"]),
    energyLevel: getText(fields["Energy Level"]),
    outcomeBenefit: getText(fields["Outcome/Benefit"]),
    photo: getPhotoUrl(fields.Photo),
    studioSite: getFirstString(signUpLink),
    start,
    status: getLabel(fields.Status) || "Scheduled"
  };
};

export const handler = async () => {
  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID || DEFAULT_TABLE_ID;
  const viewId = process.env.AIRTABLE_VIEW_ID || "";
  const windowDays = process.env.AIRTABLE_SESSION_WINDOW_DAYS || DEFAULT_WINDOW_DAYS;

  if (!token) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Missing AIRTABLE_TOKEN environment variable"
      })
    };
  }

  try {
    const records = [];
    let offset = "";

    do {
      const params = new URLSearchParams({
        pageSize: "100"
      });

      if (viewId) params.set("view", viewId);
      fieldNames.forEach((field) => params.append("fields[]", field));
      params.set(
        "filterByFormula",
        `AND(IS_AFTER({Start}, DATEADD(TODAY(), -2, 'days')), IS_BEFORE({Start}, DATEADD(TODAY(), ${windowDays}, 'days')))`
      );
      params.append("sort[0][field]", "Start");
      params.append("sort[0][direction]", "asc");
      if (offset) params.set("offset", offset);

      const response = await fetch(
        `${AIRTABLE_API_URL}/${baseId}/${tableId}?${params.toString()}`,
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
          body: JSON.stringify({
            error: "Airtable request failed",
            detail
          })
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
        sessions: records.map(mapRecord)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Unable to load Airtable sessions",
        detail: error instanceof Error ? error.message : String(error)
      })
    };
  }
};
