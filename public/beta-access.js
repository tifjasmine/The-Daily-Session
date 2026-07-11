(function () {
  const PASSWORD = "Password123";
  const MEMBER_KEY = "tdsMember";
  const SESSION_KEY = "tdsSupabaseSession";
  const ALLOWED_EMAILS = new Set(["tiffjasmine92@gmail.com", "yourdailysession@gmail.com"]);

  const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
  const isAllowedEmail = (email) => ALLOWED_EMAILS.has(normalizeEmail(email));
  const nameFor = (email) => (normalizeEmail(email) === "tiffjasmine92@gmail.com" ? "Tiffany" : "The Daily Session");
  const userIdFor = (email) => `beta-${normalizeEmail(email).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  const sessionFor = (email) => ({
    accessToken: "beta-access",
    refreshToken: "beta-refresh",
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    user: {
      id: userIdFor(email),
      email: normalizeEmail(email),
      user_metadata: { name: nameFor(email) }
    }
  });

  const memberFor = (email, extra = {}) => ({
    ...extra,
    email: normalizeEmail(email),
    name: extra.name || nameFor(email),
    paid: true,
    profileComplete: true,
    betaAccess: true,
    hasPassword: true,
    authUserId: userIdFor(email)
  });

  const safeJson = (value) => {
    try {
      return JSON.parse(value || "null");
    } catch {
      return null;
    }
  };

  const activate = (email) => {
    const cleanEmail = normalizeEmail(email);
    if (!isAllowedEmail(cleanEmail)) return false;
    window.localStorage.setItem(MEMBER_KEY, JSON.stringify(memberFor(cleanEmail)));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionFor(cleanEmail)));
    return true;
  };

  const preserveBetaAccess = () => {
    const member = safeJson(window.localStorage.getItem(MEMBER_KEY));
    const session = safeJson(window.localStorage.getItem(SESSION_KEY));
    const email = normalizeEmail(member?.email || session?.user?.email);
    if (isAllowedEmail(email)) activate(email);
  };

  const jsonResponse = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" }
    });

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const method = String(init?.method || "GET").toUpperCase();
    const bodyText = typeof init?.body === "string" ? init.body : "";

    if (url.includes("/auth/v1/token?grant_type=password")) {
      const body = safeJson(bodyText) || {};
      const email = normalizeEmail(body.email);
      if (isAllowedEmail(email)) {
        if (body.password !== PASSWORD) return jsonResponse({ error: "Invalid login credentials" }, 400);
        const session = sessionFor(email);
        activate(email);
        return jsonResponse({
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
          expires_in: 60 * 60 * 24 * 30,
          expires_at: session.expiresAt,
          token_type: "bearer",
          user: session.user
        });
      }
    }

    if (url.includes("/api/member")) {
      if (url.includes("?")) {
        const parsedUrl = new URL(url, window.location.origin);
        const email = normalizeEmail(parsedUrl.searchParams.get("email"));
        if (isAllowedEmail(email)) return jsonResponse({ member: memberFor(email) });
      }

      if (method === "POST") {
        const body = safeJson(bodyText) || {};
        const email = normalizeEmail(body.member?.email || body.email);
        if (isAllowedEmail(email)) return jsonResponse({ member: memberFor(email, body.member || {}) });
      }
    }

    return originalFetch(input, init);
  };

  preserveBetaAccess();
  window.setInterval(preserveBetaAccess, 1500);
  window.tdsBetaAccess = { activate, isAllowedEmail, password: PASSWORD };
})();
