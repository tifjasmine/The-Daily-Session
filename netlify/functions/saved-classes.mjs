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
  usersTable:
    process.env.AIRTABLE_SAVED_CLASSES_USERS_TABLE_ID ||
    process.env.AIRTABLE_USERS_TABLE_ID ||
    process.env.AIRTABLE_MEMBERS_TABLE_ID ||
    process.env.AIRTABLE_USERS_TABLE ||
    DEFAULT_LINKED_USERS_TABLE_ID
});

const getText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(getText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return value.name || value.label || value.value || value.text || value.url || value.title || "";
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
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const USER_TABLE_EMAIL_FIELDS = ["Email", "Email Address", "User Email", "Email (from Users)", "Member Email"];
const SAVED_CLASS_EMAIL_FIELDS = ["Email (from Users)", "Email", "Member Email", "User Email"];
const SAVED_CLASS_LINK_FIELDS = ["Class Name", "Classes", "Class", "Linked Class"];
const SAVED_CLASS_ID_FIELDS = ["Class ID", "Record ID", "Class Record ID", "Class Record Id"];
const SAVED_CLASS_NAME_FIELDS = [
  "Snapshot: Class Name",
  "Class Name (from Classes)",
  "Class Type (from Classes)",
  "Class Name",
  "Name"
];
const SAVED_CLASS_CATEGORY_FIELDS = ["Snapshot: Category", "Category (from Classes)", "Category"];
const SAVED_CLASS_STUDIO_FIELDS = ["Snapshot: Studio", "Studio Name (from Classes)", "Studio Name", "Studio"];
const SAVED_CLASS_START_FIELDS = ["Snapshot: Start", "Start (from Classes)", "Start", "Start Time (NEW)", "Start Time (EST Only)"];
const SAVED_CLASS_SIGNUP_FIELDS = [
  "Snapshot: Sign Up Link",
  "Sign Up Link (from Classes)",
  "Sign Up Link",
  "Booking URL",
  "URL"
];
const SAVED_CLASS_DESCRIPTION_FIELDS = ["Snapshot: Description", "Description (from Classes)", "Description"];
const SAVED_CLASS_PHOTO_FIELDS = ["Snapshot: Photo", "Photo (from Classes)", "Photo"];
const SAVED_CLASS_RATE_FIELDS = ["Snapshot: Price", "Rate (from Classes)", "Rate", "Price", "Drop in Rate"];
const SAVED_CLASS_LEVEL_FIELDS = ["Snapshot: Level", "Level (from Classes)", "Level"];
const SAVED_CLASS_MEMBER_NAME_FIELDS = ["Member Name", "Name", "Full Name", "Snapshot: Member Name"];

let cachedSavedClassesFieldSet = null;

const mapRecord = (record) => {
  const fields = record.fields || {};
  const classId = getText(getField(fields, SAVED_CLASS_ID_FIELDS));
  const linkedClass = getLinkedRecordIds(getField(fields, SAVED_CLASS_LINK_FIELDS))[0] || "";

  return {
    id: record.id,
    savedAt: getText(getField(fields, ["Date added", "Saved At", "Created", "Created Time"])) || record.createdTime || "",
    memberName: getText(getField(fields, ["Member Name", "Snapshot: Member Name", "Full Name", "Name"])),
    memberEmail: getText(getField(fields, ["Email (from Users)", "Email", "Member Email", "User Email"])),
    classId: classId || linkedClass,
    title: getText(getField(fields, SAVED_CLASS_NAME_FIELDS)) || "Class",
    category: getText(getField(fields, SAVED_CLASS_CATEGORY_FIELDS)),
    studio: getText(getField(fields, SAVED_CLASS_STUDIO_FIELDS)),
    start: getText(getField(fields, SAVED_CLASS_START_FIELDS)),
    signUpLink: getText(getField(fields, SAVED_CLASS_SIGNUP_FIELDS)),
    description: getText(getField(fields, SAVED_CLASS_DESCRIPTION_FIELDS)),
    photo: getPhotoUrl(getField(fields, SAVED_CLASS_PHOTO_FIELDS)),
    price: getText(getField(fields, SAVED_CLASS_RATE_FIELDS)),
    level: getText(getField(fields, SAVED_CLASS_LEVEL_FIELDS)),
    neighborhood: getText(getField(fields, ["Snapshot: Neighborhood", "Neighborhood"])),
    address: getText(getField(fields, ["Snapshot: Address", "Address"]))
  };
};

const getSavedClassFieldSet = async () => {
  if (cachedSavedClassesFieldSet !== null) return cachedSavedClassesFieldSet;

  const { token, baseId, table } = getConfig();
  try {
    const response = await fetch(`${AIRTABLE_API_URL}/meta/bases/${baseId}/tables`, {
      headers: { authorization: `Bearer ${token}` }
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || response.statusText || "Airtable metadata request failed");

    const tableMeta = (payload.tables || []).find((item) => item.id === table || item.name === table);
    cachedSavedClassesFieldSet = new Set((tableMeta?.fields || []).map((field) => String(field.name)));
  } catch {
    cachedSavedClassesFieldSet = new Set();
  }

  return cachedSavedClassesFieldSet;
};

const pickField = (fieldSet, names, fallback = "") => {
  if (fieldSet.size) {
    for (const name of names) {
      if (fieldSet.has(name)) return name;
    }
  }
  return fallback || "";
};

const airtableRequest = async ({ method = "GET", table = getConfig().table, path = "", params, body }) => {
  const { token, baseId } = getConfig();
  if (!token) throw new Error("Missing AIRTABLE_TOKEN environment variable");

  const query = params ? `?${params.toString()}` : "";
  const response = await fetch(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}${path}${query}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

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
    headers: { authorization: `Bearer ${token}` }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error || text || "Airtable request failed");
  }
  return payload;
};

const fetchAllRecords = async ({ table, params }) => {
  const records = [];
  let offset = "";
  const baseParams = params ? new URLSearchParams(params) : new URLSearchParams();

  do {
    const requestParams = new URLSearchParams(baseParams);
    if (offset) requestParams.set("offset", offset);
    const payload = await fetchTable({ table, params: requestParams });
    records.push(...(payload.records || []));
    offset = payload.offset || "";
  } while (offset);

  return records;
};

const getLinkedUserIds = (fields) => {
  const raw = getField(fields, ["Users"]);
  return getLinkedRecordIds(raw);
};

const getLinkedClassIds = (fields) => {
  const raw = getField(fields, SAVED_CLASS_LINK_FIELDS);
  return getLinkedRecordIds(raw);
};

const getLinkedRecordIds = (raw) => {
  if (Array.isArray(raw)) {
    return raw.map((item) => (typeof item === "string" ? item : item?.id)).filter(Boolean);
  }
  if (typeof raw === "string") return [raw];
  if (raw?.id) return [raw.id];
  return [];
};

const hasEmailMatch = (fields, targetEmail, candidates = SAVED_CLASS_EMAIL_FIELDS) => {
  const email = normalizeEmail(getText(getField(fields, candidates)));
  return Boolean(email && targetEmail && email === normalizeEmail(targetEmail));
};

const hasClassIdMatch = (fields, classId) => {
  const normalized = String(classId || "").trim();
  if (!normalized) return false;
  if (getText(getField(fields, SAVED_CLASS_ID_FIELDS)).trim() === normalized) return true;
  return getLinkedClassIds(fields).includes(normalized);
};

const hasLinkedUser = (fields, userId) => {
  return Boolean(userId && getLinkedUserIds(fields).includes(userId));
};

const findLinkedUserId = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return "";

  const { usersTable } = getConfig();
  if (!usersTable) return "";

  const formulaCandidates = USER_TABLE_EMAIL_FIELDS.map(
    (field) => `LOWER({${field}})="${escapeFormulaString(normalizedEmail)}"`
  );

  for (const filterByFormula of formulaCandidates) {
    try {
      const payload = await fetchTable({
        table: usersTable,
        params: new URLSearchParams({ pageSize: "1", filterByFormula })
      });
      const record = payload.records?.[0];
      if (record?.id) return record.id;
    } catch {
      continue;
    }
  }

  const userRecords = await fetchAllRecords({ table: usersTable, params: new URLSearchParams({ pageSize: "100" }) });
  const match = userRecords.find((record) => hasEmailMatch(record.fields || {}, normalizedEmail, USER_TABLE_EMAIL_FIELDS));
  return match?.id || "";
};

const findSaved = async ({ email, classId, userId }) => {
  if (!classId) return null;
  const { table } = getConfig();

  const records = await fetchAllRecords({ table, params: new URLSearchParams({ pageSize: "100" }) });
  const normalizedEmail = normalizeEmail(email);

  return (
    records.find((record) => {
      const fields = record.fields || {};
      if (!hasClassIdMatch(fields, classId)) return false;
      if (userId && hasLinkedUser(fields, userId)) return true;
      if (normalizedEmail && hasEmailMatch(fields, normalizedEmail, SAVED_CLASS_EMAIL_FIELDS)) return true;
      return false;
    }) || null
  );
};

const listSaved = async (email) => {
  const { table } = getConfig();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return [];

  const userId = await findLinkedUserId(normalizedEmail).catch(() => "");
  const records = await fetchAllRecords({ table, params: new URLSearchParams({ pageSize: "100" }) });

  return records
    .filter((record) => {
      const fields = record.fields || {};
      return userId
        ? hasLinkedUser(fields, userId) || hasEmailMatch(fields, normalizedEmail, SAVED_CLASS_EMAIL_FIELDS)
        : hasEmailMatch(fields, normalizedEmail, SAVED_CLASS_EMAIL_FIELDS);
    })
    .map(mapRecord);
};

const toFields = async ({ userId, memberName, memberEmail, session }) => {
  const fieldSet = await getSavedClassFieldSet();
  const fields = {
    Users: userId ? [userId] : undefined
  };

  const setField = (candidates, value, fallback = "") => {
    if (value === undefined || value === null || value === "") return;
    const key = pickField(fieldSet, candidates, fallback);
    if (!key) return;
    fields[key] = value;
  };

  fields.Name = memberName || memberEmail || "Saved Class User";
  fields["Class Name"] = session.recordId || session.id ? [session.recordId || session.id] : undefined;
  fields["Date added"] = new Date().toISOString();
  setField(["Snapshot: Class Name"], session.title || "", "");
  setField(["Snapshot: Category"], session.category || "", "");
  setField(["Snapshot: Studio"], session.studio || "", "");
  setField(["Snapshot: Start"], session.start || session.startIso || "", "");
  setField(["Snapshot: Sign Up Link"], session.studioSite || session.signUpLink || "", "");
  setField(["Snapshot: Description"], session.description || "", "");
  setField(["Snapshot: Photo"], session.photo ? [{ url: session.photo }] : undefined, "");
  setField(["Snapshot: Price"], session.dropInRate || session.priceBracket || "", "");
  setField(["Snapshot: Level"], session.level || "", "");
  setField(["Member Name", "Snapshot: Member Name"], memberName || "", "");
  setField(["Member Email", "User Email"], memberEmail || "", "");

  return fields;
};

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
      const memberName = String(payload.memberName || "").trim();
      const memberEmail = String(payload.memberEmail || email || "").trim();
      const session = payload.session || {};
      const classId = session.recordId || session.id || "";

      if (!email) return json(400, { error: "Missing member email" });
      if (!classId) return json(400, { error: "Missing class id" });

      const userId = await findLinkedUserId(email);
      const existing = await findSaved({ email, classId, userId }).catch(() => null);
      if (existing) {
        return json(200, { savedClass: mapRecord(existing), alreadySaved: true });
      }

      if (!userId) {
        return json(400, {
          error: "Member not found in Airtable Users",
          detail: "Saved Classes expects member records in the connected Users table."
        });
      }

      const fields = await toFields({
        userId,
        memberName,
        memberEmail,
        session
      });
      const created = await airtableRequest({
        method: "POST",
        body: { fields: compactFields(fields), typecast: true }
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