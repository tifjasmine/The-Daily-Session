const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_BASE_ID = "appQxIhwr00DmKBx5";
const DEFAULT_TABLE_NAME = "Saved Classes";
const DEFAULT_LINKED_USERS_TABLE_ID = "tblJAG7I7Fsd5awRo";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body)
});

const getConfig = () => ({
  token: process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY,
  baseId: process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID,
  table: process.env.AIRTABLE_SAVED_CLASSES_TABLE_ID || process.env.AIRTABLE_SAVED_CLASSES_TABLE || DEFAULT_TABLE_NAME,
  userTables: [
    process.env.AIRTABLE_SAVED_CLASSES_USERS_TABLE_ID,
    DEFAULT_LINKED_USERS_TABLE_ID,
    process.env.AIRTABLE_USERS_TABLE_ID,
    process.env.AIRTABLE_USERS_TABLE,
    "Users",
    process.env.AIRTABLE_MEMBERS_TABLE_ID,
    "Members"
  ].filter(Boolean)
});

const getText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(getText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return value.name || value.label || value.value || value.text || value.title || value.url || "";
  }
  return "";
};

const getPhotoUrl = (value) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === "string") return first;
    if (first?.url) return first.url;
    if (first?.thumbnails?.large?.url) return first.thumbnails.large.url;
  }
  if (value?.url) return value.url;
  return "";
};

const getField = (fields, names) => {
  for (const name of names) {
    if (fields[name] !== undefined) return fields[name];
  }
  return "";
};

const escapeFormulaString = (value) => String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const memberEmailFormula = (email) =>
  `LOWER({Email (from Users)})="${escapeFormulaString(email.toLowerCase())}"`;

const mapRecord = (record) => {
  const fields = record.fields || {};
  const classId = getText(getField(fields, ["Class ID", "Record ID", "Class Record ID"]));
  const linkedClass = getText(getField(fields, ["Class", "Classes", "Linked Class"]));

  return {
    id: record.id,
    savedAt: getText(getField(fields, ["Saved At", "Created", "Created Time"])) || record.createdTime || "",
    memberEmail: getText(getField(fields, ["Email (from Users)", "Email", "Member Email", "User Email"])),
    classId: classId || linkedClass,
    title: getText(getField(fields, ["Snapshot: Class Name", "Class Name", "Name"])) || "Class",
    category: getText(getField(fields, ["Snapshot: Category", "Category"])),
    studio: getText(getField(fields, ["Snapshot: Studio", "Studio", "Studio Name"])),
    start: getText(getField(fields, ["Snapshot: Start", "Start", "Start Time (NEW)"])),
    signUpLink: getText(getField(fields, ["Snapshot: Sign Up Link", "Sign Up Link", "Booking URL", "URL"])),
    description: getText(getField(fields, ["Snapshot: Description", "Description"])),
    photo: getPhotoUrl(getField(fields, ["Snapshot: Photo", "Photo"])),
    price: getText(getField(fields, ["Snapshot: Price", "Price", "Rate", "Drop in Rate"])),
    level: getText(getField(fields, ["Snapshot: Level", "Level"])),
    neighborhood: getText(getField(fields, ["Snapshot: Neighborhood", "Neighborhood"])),
    address: getText(getField(fields, ["Snapshot: Address", "Address"]))
  };
};

const airtableRequest = async ({ method = "GET", path = "", params, body }) => {
  const { token, baseId, table } = getConfig();
  if (!token) throw new Error("Missing AIRTABLE_TOKEN environment variable");

  const query = params ? `?${params.toString()}` : "";
  const response = await fetch(
    `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}${path}${query}`,
    {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    }
  );

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error || text || "Airtable request failed");
  }
  return payload;
};

const fetchTable = async ({ table, params }) => {
  const { token, baseId } = getConfig();
  if (!token) throw new Error("Missing AIRTABLE_TOKEN environment variable");

  const query = params ? `?${params.toString()}` : "";
  const response = await fetch(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}${query}`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(payload?.error?.message || payload?.error || text || "Airtable request failed");
  return payload;
};

const findLinkedUserId = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return "";

  const { userTables } = getConfig();
  const formulas = [
    `LOWER({Email})="${escapeFormulaString(normalizedEmail)}"`,
    `LOWER({Email Address})="${escapeFormulaString(normalizedEmail)}"`,
    `LOWER({User Email})="${escapeFormulaString(normalizedEmail)}"`
  ];

  for (const table of [...new Set(userTables)]) {
    for (const filterByFormula of formulas) {
      try {
        const params = new URLSearchParams({ pageSize: "1", filterByFormula });
        const payload = await fetchTable({ table, params });
        const record = payload.records?.[0];
        if (record?.id) return record.id;
      } catch {
        // Try the next likely user table/field shape.
      }
    }
  }

  return "";
};

const findSaved = async ({ email, classId }) => {
  if (!email || !classId) return null;

  const params = new URLSearchParams({
    pageSize: "1",
    filterByFormula: `AND(${memberEmailFormula(email)}, {Class ID}="${escapeFormulaString(classId)}")`
  });
  const payload = await airtableRequest({ params });
  return payload.records?.[0] || null;
};

const listSaved = async (email) => {
  const records = [];
  let offset = "";

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (email) {
      params.set("filterByFormula", memberEmailFormula(email));
    }
    if (offset) params.set("offset", offset);

    const payload = await airtableRequest({ params });
    records.push(...(payload.records || []));
    offset = payload.offset || "";
  } while (offset);

  return records.map(mapRecord);
};

const toFields = ({ userId, session }) => ({
  Users: userId ? [userId] : undefined,
  "Class ID": session.recordId || session.id || "",
  "Snapshot: Class Name": session.title || "",
  "Snapshot: Category": session.category || "",
  "Snapshot: Studio": session.studio || "",
  "Snapshot: Start": session.start || session.startIso || "",
  "Snapshot: Sign Up Link": session.studioSite || session.signUpLink || "",
  "Snapshot: Description": session.description || "",
  "Snapshot: Photo": session.photo ? [{ url: session.photo }] : undefined,
  Rate: session.dropInRate || session.priceBracket || "",
  Level: session.level || ""
});

const compactFields = (fields) =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      return value !== "";
    })
  );

export const handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const email = String(event.queryStringParameters?.email || "").trim();
      return json(200, { savedClasses: await listSaved(email) });
    }

    if (event.httpMethod === "POST") {
      const payload = event.body ? JSON.parse(event.body) : {};
      const email = String(payload.email || payload.memberEmail || "").trim();
      const session = payload.session || {};
      const classId = session.recordId || session.id || "";

      if (!email) return json(400, { error: "Missing member email" });
      if (!classId) return json(400, { error: "Missing class id" });

      const existing = await findSaved({ email, classId }).catch(() => null);
      if (existing) {
        return json(200, { savedClass: mapRecord(existing), alreadySaved: true });
      }

      const userId = await findLinkedUserId(email);
      if (!userId) {
        return json(400, {
          error: "Member not found in Airtable Users",
          detail: "Saved Classes uses a linked Users field. Add this member to the Users table or set AIRTABLE_USERS_TABLE_ID."
        });
      }

      const created = await airtableRequest({
        method: "POST",
        body: { fields: compactFields(toFields({ userId, session })), typecast: true }
      });

      return json(200, { savedClass: mapRecord(created), alreadySaved: false });
    }

    return json(405, { error: "Method not allowed" });
  } catch (error) {
    return json(500, {
      error: "Airtable saved classes request failed",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
