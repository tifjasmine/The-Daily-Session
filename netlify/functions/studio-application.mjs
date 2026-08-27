const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_BASE_ID = "appQxIhwr00DmKBx5";
const DEFAULT_TABLES = ["Studio Sign Up"];

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body)
});

const getText = (value) => {
  if (Array.isArray(value)) return value.map(getText).filter(Boolean).join(", ");
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const cleanList = (values = []) => {
  const list = Array.isArray(values) ? values : [values];
  return list.map(getText).filter(Boolean).filter((value) => value !== "Other");
};

const cleanUnlisted = (...values) =>
  values
    .map(getText)
    .filter(Boolean)
    .join(", ");

const fetchTables = async ({ token, baseId }) => {
  const response = await fetch(`${AIRTABLE_API_URL}/meta/bases/${baseId}/tables`, {
    headers: { authorization: `Bearer ${token}` }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Unable to read Airtable schema");
  return payload.tables || [];
};

const findTable = (tables, preferredTable) => {
  const candidates = [...new Set([preferredTable, ...DEFAULT_TABLES].filter(Boolean))];
  return candidates
    .map((candidate) => tables.find((table) => table.id === candidate || table.name === candidate))
    .find(Boolean);
};

const normalizeKey = (value) => getText(value).toLowerCase().replace(/[^a-z0-9]+/g, "");

const findField = (fieldMap, names) => {
  const fields = Array.from(fieldMap.keys());
  const direct = names.find((name) => fieldMap.has(name));
  if (direct) return direct;

  const normalizedNames = names.map(normalizeKey);
  const normalized = fields.find((field) => normalizedNames.includes(normalizeKey(field)));
  if (normalized) return normalized;

  return fields.find((field) => {
    const normalizedField = normalizeKey(field);
    return normalizedNames.some((name) => normalizedField.includes(name) || name.includes(normalizedField));
  });
};

const coerceValue = (field, value) => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value) && !value.length) return undefined;
  if (!Array.isArray(value) && getText(value) === "" && field.type !== "checkbox") return undefined;

  if (field.type === "multipleAttachments") return undefined;
  if (field.type === "checkbox") return Boolean(value);
  if (field.type === "multipleSelects") {
    const choices = field.options?.choices?.map((choice) => choice.name) || [];
    const list = Array.isArray(value) ? value : [getText(value)];
    const filtered = choices.length ? list.filter((item) => choices.includes(getText(item))) : list;
    return filtered.length ? filtered : undefined;
  }
  if (field.type === "singleSelect") {
    const choices = field.options?.choices?.map((choice) => choice.name) || [];
    const nextValue = Array.isArray(value) ? getText(value[0]) : getText(value);
    if (choices.length && !choices.includes(nextValue)) return undefined;
    return nextValue;
  }
  if (field.type === "number") {
    const number = Number(getText(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(number) ? number : undefined;
  }

  return Array.isArray(value) ? value.join(", ") : getText(value);
};

const setField = (fields, fieldMap, names, value) => {
  const name = findField(fieldMap, names);
  if (!name) return;
  const nextValue = coerceValue(fieldMap.get(name), value);
  if (nextValue !== undefined) fields[name] = nextValue;
};

const setPendingStatus = (fields, fieldMap) => {
  const name = findField(fieldMap, ["Status", "Application Status", "Approval Status"]);
  if (!name) return;
  const field = fieldMap.get(name);
  const choices = field.options?.choices?.map((choice) => choice.name) || [];
  const pending =
    choices.find((choice) => /pending review/i.test(choice)) ||
    choices.find((choice) => /^pending$/i.test(choice)) ||
    choices.find((choice) => /review/i.test(choice)) ||
    "Pending Review";
  fields[name] = pending;
};

const buildFields = (payload, table) => {
  const fieldMap = new Map((table.fields || []).map((field) => [field.name, field]));
  const fields = {};
  const neighborhoods = cleanList(payload.neighborhood);
  const categories = cleanList(payload.category);
  const subcategories = cleanList(payload.subcategory);

  setField(fields, fieldMap, ["Full Name", "Contact Name", "Submitted By", "Applicant Name", "Your Name", "First and Last Name"], payload.fullName);
  setField(fields, fieldMap, ["Email", "Contact Email"], payload.email);
  setField(fields, fieldMap, ["Studio Role", "Your Role at the Studio", "Role at the Studio", "Role", "Contact Role", "Title"], payload.role);
  setField(fields, fieldMap, ["Studio/Business Name", "Studio Name", "Business Name", "Studio", "Business", "Name"], payload.businessName);
  setField(fields, fieldMap, ["Studio Address", "Address"], payload.address);
  setField(fields, fieldMap, ["Studio Neighborhood", "Neighborhood", "Philadelphia Neighborhood"], neighborhoods);
  setField(fields, fieldMap, ["Neighborhood Unlisted", "Studio Neighborhood Unlisted", "Other Neighborhood", "Unlisted Neighborhood"], payload.otherNeighborhood);
  setField(fields, fieldMap, ["Website", "Studio Site", "Site"], payload.website);
  setField(fields, fieldMap, ["Instagram / Social", "Instagram", "Social Media"], payload.instagram);
  setField(fields, fieldMap, ["Category", "Primary Category"], categories);
  setField(fields, fieldMap, ["Category Unlisted", "Other Category", "Unlisted Category"], payload.otherCategory);
  setField(fields, fieldMap, ["Subcategory", "Subcategories", "Class Subcategory", "Class Subcategories"], subcategories);
  setField(fields, fieldMap, ["Subcategory Unlisted", "Subcategories Unlisted", "Other Subcategory", "Unlisted Subcategory"], payload.otherSubcategory);
  setField(fields, fieldMap, ["Describe your classes", "Class Description", "Class Types"], payload.classDesc);
  setField(fields, fieldMap, ["Average Class Size", "Avg Class Size"], payload.avgSize);
  setField(fields, fieldMap, ["Price Range per Class", "Price Range", "Drop in Rate"], payload.price);
  setField(fields, fieldMap, ["Booking Platform"], payload.booking);
  setField(fields, fieldMap, ["Public Calendar Link", "Schedule URL", "Booking Link", "Booking URL"], payload.calendar);
  setField(
    fields,
    fieldMap,
    [
      "Studio Perks",
      "Member Perks",
      "Member Perk",
      "Perk",
      "Perk Details",
      "Would you be open to offering a perk to Daily Session members",
      "Would you be open to offering a perk to Daily Session members ( Free first class, % off drop-in, % off class pack, etc)"
    ],
    payload.studioPerks
  );
  setField(fields, fieldMap, ["Typed Signature", "Signature Text", "Applicant Signature", "Signed Name", "Signature"], payload.signature);
  setField(fields, fieldMap, ["Media Consent"], payload.mediaConsent);
  setField(fields, fieldMap, ["Authorized Representative", "Authorization Consent"], payload.authConsent);
  setField(fields, fieldMap, ["Listed Consent", "Calendar Consent"], payload.listedConsent);
  setField(fields, fieldMap, ["Submitted At", "Submission Date"], new Date().toISOString());
  setPendingStatus(fields, fieldMap);

  return fields;
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const token =
    process.env.AIRTABLE_STUDIO_APPLICATIONS_TOKEN ||
    process.env.AIRTABLE_TOKEN ||
    process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID;
  const preferredTable =
    process.env.AIRTABLE_STUDIO_APPLICATIONS_TABLE_ID ||
    process.env.AIRTABLE_STUDIO_APPLICATIONS_TABLE ||
    process.env.AIRTABLE_COMPANIES_TABLE_ID ||
    process.env.AIRTABLE_COMPANIES_TABLE;

  if (!token) return json(500, { error: "Missing AIRTABLE_STUDIO_APPLICATIONS_TOKEN environment variable" });

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    if (!payload.fullName || !payload.email || !payload.businessName || !payload.address) {
      return json(400, { error: "Missing required studio application fields" });
    }

    const tables = await fetchTables({ token, baseId });
    const table = findTable(tables, preferredTable);
    if (!table) return json(404, { error: "Unable to find the Studio Sign Up Airtable table" });

    const fields = buildFields(payload, table);
    if (!Object.keys(fields).length) {
      return json(400, { error: "No matching Airtable fields were found for this application" });
    }

    const response = await fetch(`${AIRTABLE_API_URL}/${baseId}/${table.id}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ fields })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json(response.status, {
        error: result?.error?.message || result?.error || "Airtable application submit failed"
      });
    }

    return json(200, {
      ok: true,
      recordId: result.id,
      table: table.name
    });
  } catch (error) {
    return json(500, {
      error: "Studio application request failed",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
