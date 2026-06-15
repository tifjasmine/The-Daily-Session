const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_BASE_ID = "appQxIhwr00DmKBx5";
const DEFAULT_MEMBERS_TABLE = "Members";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body)
});

const getConfig = () => ({
  token: process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY,
  baseId: process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID,
  tableId: process.env.AIRTABLE_MEMBERS_TABLE_ID || DEFAULT_MEMBERS_TABLE
});

const escapeFormulaString = (value) => String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const normalizeBoolean = (value) => value === true || String(value).toLowerCase() === "true";

const mapMember = (record) => {
  const fields = record?.fields || {};

  return {
    recordId: record?.id || "",
    email: fields.Email || "",
    paid: normalizeBoolean(fields.Paid),
    membershipType: fields["Membership Type"] || "",
    profileComplete: normalizeBoolean(fields["Profile Complete"]),
    name: fields.Name || "",
    pronouns: fields.Pronouns || "",
    birthday: fields.Birthday || "",
    instagram: fields.Instagram || "",
    neighborhood: fields.Neighborhood || "",
    heard: fields["Heard About Us"] || "",
    interests: fields.Interests || "",
    experience: fields["Experience Level"] || "",
    bio: fields.Bio || "",
    stripeCustomerId: fields["Stripe Customer ID"] || "",
    stripeSubscriptionId: fields["Stripe Subscription ID"] || ""
  };
};

const toFields = (member) => {
  const fields = {};
  const setString = (name, value) => {
    if (value !== undefined && value !== null) fields[name] = String(value);
  };

  setString("Email", member.email);
  if (member.paid !== undefined) fields.Paid = Boolean(member.paid);
  setString("Membership Type", member.membershipType);
  if (member.profileComplete !== undefined) {
    fields["Profile Complete"] = Boolean(member.profileComplete);
  }
  setString("Name", member.name);
  setString("Pronouns", member.pronouns);
  setString("Birthday", member.birthday);
  setString("Instagram", member.instagram);
  setString("Neighborhood", member.neighborhood);
  setString("Heard About Us", member.heard);
  setString("Interests", member.interests);
  setString("Experience Level", member.experience);
  setString("Bio", member.bio);
  setString("Stripe Customer ID", member.stripeCustomerId);
  setString("Stripe Subscription ID", member.stripeSubscriptionId);

  return fields;
};

export const findMemberByEmail = async (email) => {
  const { token, baseId, tableId } = getConfig();
  if (!token) throw new Error("Missing AIRTABLE_TOKEN environment variable");

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  const params = new URLSearchParams({
    pageSize: "1",
    filterByFormula: `LOWER({Email})="${escapeFormulaString(normalizedEmail)}"`
  });

  const response = await fetch(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableId)}?${params}`, {
    headers: { authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error(await response.text());

  const payload = await response.json();
  const record = payload.records?.[0];
  return record ? mapMember(record) : null;
};

export const upsertMember = async (member) => {
  const { token, baseId, tableId } = getConfig();
  if (!token) throw new Error("Missing AIRTABLE_TOKEN environment variable");

  const email = String(member.email || "").trim().toLowerCase();
  if (!email) throw new Error("Missing member email");

  const existing = member.recordId ? { recordId: member.recordId } : await findMemberByEmail(email);
  const fields = toFields({ ...member, email });
  const urlBase = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableId)}`;
  const response = await fetch(existing?.recordId ? `${urlBase}/${existing.recordId}` : urlBase, {
    method: existing?.recordId ? "PATCH" : "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) throw new Error(await response.text());

  return mapMember(await response.json());
};

export const handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const member = await findMemberByEmail(event.queryStringParameters?.email || "");
      return json(200, { member });
    }

    if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
      const payload = event.body ? JSON.parse(event.body) : {};
      const member = await upsertMember(payload.member || payload);
      return json(200, { member });
    }

    return json(405, { error: "Method not allowed" });
  } catch (error) {
    return json(500, {
      error: "Airtable member request failed",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
