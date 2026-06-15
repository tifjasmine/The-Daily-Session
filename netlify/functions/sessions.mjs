const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_BASE_ID = "appQxIhwr00DmKBx5";
const DEFAULT_TABLE_ID = "tblGTqTTdAlPPVXm0";

const fieldNames = [
  "Start Time (NEW)",
  "Category",
  "Class Name",
  "Studio/Business Name (from Studio Info 2)",
  "Neighborhood",
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
    neighborhood: getLabel(fields.Neighborhood),
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
