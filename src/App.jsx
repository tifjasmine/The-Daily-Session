import { useEffect, useMemo, useRef, useState } from "react";

const EASTERN_TZ = "America/New_York";
const FIXED_STUDIO_COUNT = 51;
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://zpgvztndfkochixhuvaf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_IAjh2tVf_Ejkyh4HYh4KwA_BuQ-KnR1";
const SUPABASE_SESSION_KEY = "tdsSupabaseSession";
const MEMBER_STORAGE_KEY = "tdsMember";

const content = {
  headerLabel: "PHILADELPHIA'S MOVEMENT & WELLNESS GUIDE",
  mainHeading: "Everything moving in Philadelphia.",
  description:
    "Yoga, dance, circus, pottery, pilates, and more - handpicked and updated daily so you never miss what's happening in your city.",
  studiosDescription: "Local studios & instructors"
};

const floorToMinute = (date) => {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getEasternDateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";

  return `${y}-${m}-${d}`;
};

const formatEasternLongDate = (date) =>
  date.toLocaleDateString("en-US", {
    timeZone: EASTERN_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

const formatEasternMonthDay = (date) =>
  date.toLocaleDateString("en-US", {
    timeZone: EASTERN_TZ,
    month: "long",
    day: "numeric"
  });

const formatEasternHeaderDate = (date) =>
  date.toLocaleDateString("en-US", {
    timeZone: EASTERN_TZ,
    month: "long",
    day: "numeric",
    year: "numeric"
  });

const formatEasternTime = (date) =>
  date.toLocaleTimeString("en-US", {
    timeZone: EASTERN_TZ,
    hour: "numeric",
    minute: "2-digit"
  });

const isCancelled = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized.includes("cancelled") || normalized.includes("canceled");
};

const animateNumber = (from, to, setValue, duration = 850) => {
  if (from === to) {
    setValue(String(to));
    return () => {};
  }

  const start = performance.now();
  let rafId = null;

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(from + (to - from) * eased);

    setValue(String(value));

    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
};

const MiniCalendarLogo = () => (
  <div className="tds-mini-logo" aria-hidden="true">
    <div className="tds-mini-logo-rings">
      <span />
      <span />
    </div>
    <div className="tds-mini-logo-top" />
    <div className="tds-mini-logo-grid">
      {Array.from({ length: 12 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  </div>
);

const BrandLockup = () => (
  <div className="tds-brand-lockup">
    <img src="/tds-logo-stacked-light.png" alt="The Daily Session Philadelphia" />
  </div>
);

const StatsCard = ({ label, value, description }) => (
  <div className="tds-stat">
    <span className="tds-stat-label">{label}</span>
    <div className="tds-stat-value">{value}</div>
    {description ? <span className="tds-stat-description">{description}</span> : null}
  </div>
);

const getCategoryPillStyle = (categoryLabel) => {
  const lower = categoryLabel.toLowerCase();

  if (lower.includes("mind") || lower.includes("body")) {
    return { background: "#f1e2d2", color: "#7a4a2a", border: "#e2c4aa" };
  }

  if (lower.includes("dance") || lower.includes("movement")) {
    return { background: "#f6dfc9", color: "#9b5a2e", border: "#e7bc94" };
  }

  if (lower.includes("creative") || lower.includes("arts")) {
    return { background: "#e8e4d9", color: "#5f5b49", border: "#cfc7b4" };
  }

  if (lower.includes("martial")) {
    return { background: "#e5e1dd", color: "#5a5148", border: "#c9c1b8" };
  }

  if (lower.includes("fitness") || lower.includes("sport")) {
    return { background: "#eee4d8", color: "#6b4a2f", border: "#d8c1a9" };
  }

  return { background: "#f1e2d2", color: "#7a4a2a", border: "#e2c4aa" };
};

const normalizeSession = (session) => ({
  ...session,
  title: session.title || session.className || "Untitled Class",
  studio: session.studio || session.studioName || "Studio",
  category: session.category || "Class",
  subcategory: session.subcategory || "",
  neighborhood: session.neighborhood || "",
  address: session.address || "",
  level: session.level || "",
  dropInRate: session.dropInRate || session.rate || "",
  priceBracket: session.priceBracket || "",
  description: session.description || "",
  reminder: session.reminder || "",
  googleCalendarLink: session.googleCalendarLink || "",
  tags: session.tags || "",
  moodMatcher: session.moodMatcher || "",
  energyLevel: session.energyLevel || "",
  outcomeBenefit: session.outcomeBenefit || "",
  startDate: new Date(session.start)
});

const navigateTo = (path) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const getSessionDetailPath = (session) => `/class/${encodeURIComponent(session.recordId || session.id)}`;

const normalizeDetailList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getSessionPrice = (session) => {
  const rateText = String(session.dropInRate || "").trim();

  if (rateText) {
    const cleaned = rateText.replace(/[^0-9.]/g, "");
    const amount = Number(cleaned);

    if (!Number.isNaN(amount) && cleaned) {
      if (amount === 0) return "Free";
      return `$${amount.toFixed(0)}`;
    }

    return rateText;
  }

  return String(session.priceBracket || "").trim();
};

const formatSessionDateTime = (session) => {
  if (!session?.startDate || Number.isNaN(session.startDate.getTime())) return "";

  return `${formatEasternLongDate(session.startDate)} · ${formatEasternTime(session.startDate)}`;
};

const getStoredMember = () => {
  try {
    return JSON.parse(window.localStorage.getItem(MEMBER_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

const setStoredMember = (member) => {
  window.localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(member));
};

const clearStoredMember = () => {
  window.localStorage.removeItem(MEMBER_STORAGE_KEY);
};

const getStoredSupabaseSession = () => {
  try {
    return JSON.parse(window.localStorage.getItem(SUPABASE_SESSION_KEY) || "null");
  } catch {
    return null;
  }
};

const setStoredSupabaseSession = (session) => {
  window.localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
};

const clearStoredSupabaseSession = () => {
  window.localStorage.removeItem(SUPABASE_SESSION_KEY);
};

const normalizeAuthPayload = (payload) => {
  if (!payload?.access_token) return null;

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_at || Math.floor(Date.now() / 1000) + (payload.expires_in || 3600),
    user: payload.user || null
  };
};

const supabaseAuthRequest = async (path, body, token) => {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      authorization: `Bearer ${token || SUPABASE_PUBLISHABLE_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_description || payload.msg || payload.message || "Supabase auth failed");
  return payload;
};

const signInWithPassword = async (email, password) => {
  const payload = await supabaseAuthRequest("token?grant_type=password", {
    email: String(email || "").trim().toLowerCase(),
    password
  });
  const session = normalizeAuthPayload(payload);
  if (!session) throw new Error("Could not create a Supabase session.");
  setStoredSupabaseSession(session);
  return session;
};

const signUpWithPassword = async (email, password) => {
  const payload = await supabaseAuthRequest("signup", {
    email: String(email || "").trim().toLowerCase(),
    password
  });
  const session = normalizeAuthPayload(payload);
  if (session) setStoredSupabaseSession(session);
  return { session, user: payload.user || session?.user || null };
};

const refreshSupabaseSession = async (session) => {
  if (!session?.refreshToken) return null;
  if (session.expiresAt && session.expiresAt - 60 > Math.floor(Date.now() / 1000)) return session;

  const payload = await supabaseAuthRequest("token?grant_type=refresh_token", {
    refresh_token: session.refreshToken
  });
  const refreshed = normalizeAuthPayload(payload);
  if (refreshed) setStoredSupabaseSession(refreshed);
  return refreshed;
};

const signOut = async (session) => {
  if (session?.accessToken) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: `Bearer ${session.accessToken}`
      }
    }).catch(() => {});
  }
  clearStoredSupabaseSession();
  clearStoredMember();
};

const fetchAirtableMember = async (email) => {
  const response = await fetch(`/api/member?email=${encodeURIComponent(email)}`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Member lookup failed");
  return payload.member;
};

const saveMember = async (member) => {
  const response = await fetch("/api/member", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ member })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Member save failed");
  return payload.member;
};

const supabaseProfileRequest = async (session, path, options = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || "Supabase profile request failed");
  return payload;
};

const getSupabaseProfile = async (session) => {
  if (!session?.user?.id) return null;
  const rows = await supabaseProfileRequest(
    session,
    `member_profiles?select=*&id=eq.${encodeURIComponent(session.user.id)}`
  );
  return rows?.[0] || null;
};

const saveSupabaseProfile = async (session, profile) => {
  const row = {
    id: session.user.id,
    email: session.user.email || profile.email,
    name: profile.name || "",
    pronouns: profile.pronouns || "",
    birthday: profile.birthday || null,
    instagram: profile.instagram || "",
    neighborhood: profile.neighborhood || "",
    heard: profile.heard || "",
    interests: profile.interests || "",
    experience: profile.experience || "",
    bio: profile.bio || "",
    profile_complete: Boolean(profile.profileComplete),
    updated_at: new Date().toISOString()
  };

  const rows = await supabaseProfileRequest(session, "member_profiles?on_conflict=id", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row)
  });
  return rows?.[0] || row;
};

const profileToMember = (profile) => ({
  userId: profile?.id || "",
  email: profile?.email || "",
  name: profile?.name || "",
  pronouns: profile?.pronouns || "",
  birthday: profile?.birthday || "",
  instagram: profile?.instagram || "",
  neighborhood: profile?.neighborhood || "",
  heard: profile?.heard || "",
  interests: profile?.interests || "",
  experience: profile?.experience || "",
  bio: profile?.bio || "",
  profileComplete: Boolean(profile?.profile_complete)
});

const loadAuthenticatedMember = async (session) => {
  const email = session?.user?.email || "";
  if (!email) return null;

  const [airtableMember, supabaseProfile] = await Promise.all([
    fetchAirtableMember(email).catch(() => null),
    getSupabaseProfile(session).catch(() => null)
  ]);

  return {
    ...(airtableMember || {}),
    ...profileToMember(supabaseProfile),
    email,
    paid: Boolean(airtableMember?.paid),
    authUserId: session.user.id
  };
};

const HeaderLogo = () => (
  <button type="button" className="tds-nav-logo" onClick={() => navigateTo("/")}>
    <img src="/tds-logo-stacked-light.png" alt="The Daily Session" />
  </button>
);

const AppNav = ({ member, onLogout }) => {
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const goTo = (target) => {
    setIsJoinOpen(false);
    navigateTo(target);
  };

  return (
    <nav className="tds-nav" aria-label="Main navigation">
      <HeaderLogo />
      <div>
        <button type="button" onClick={() => goTo("/")}>
          Home
        </button>
        <button type="button" onClick={() => goTo("/calendar")}>
          Calendar
        </button>
        <div className="tds-nav-menu">
          <button
            type="button"
            className="tds-nav-primary"
            aria-expanded={isJoinOpen}
            aria-haspopup="menu"
            onClick={() => setIsJoinOpen((current) => !current)}
          >
            Join Us
            <span aria-hidden="true">⌄</span>
          </button>
          {isJoinOpen ? (
            <div className="tds-nav-dropdown" role="menu">
              <button type="button" role="menuitem" onClick={() => goTo("/signup")}>
                Students
              </button>
              <button type="button" role="menuitem" onClick={() => goTo("/business")}>
                Businesses
              </button>
              <button type="button" role="menuitem" onClick={() => goTo("/providers")}>
                Providers
              </button>
            </div>
          ) : null}
        </div>
        {member ? (
          <>
            <button type="button" onClick={() => goTo("/profile")}>
              Profile
            </button>
            <button type="button" onClick={onLogout}>
              Log Out
            </button>
          </>
        ) : (
          <button type="button" onClick={() => goTo("/login")}>
            Log In
          </button>
        )}
      </div>
    </nav>
  );
};

const AuthShell = ({ title, eyebrow, children }) => (
  <main className="tds-auth-page">
    <div className="tds-auth-card">
      <aside className="tds-auth-brand-panel" aria-hidden="true">
        <BrandLockup />
        <div>
          <span>Member access</span>
          <h2>One calendar. No scavenger hunt.</h2>
          <p>Save your profile, open the full month, and find the class that fits today.</p>
        </div>
      </aside>
      <section className="tds-auth-content">
        <HeaderLogo />
        <span className="tds-auth-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </section>
    </div>
  </main>
);

const LoginPage = ({ onMemberChange, onSessionChange }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const session = await signInWithPassword(email, password);
      const authenticatedMember = await loadAuthenticatedMember(session);

      if (authenticatedMember?.paid) {
        setStoredMember(authenticatedMember);
        onSessionChange(session);
        onMemberChange(authenticatedMember);
        navigateTo(authenticatedMember.profileComplete ? "/calendar" : "/profile");
        return;
      }

      await signOut(session);
      onSessionChange(null);
      onMemberChange(null);
      setMessage("That login works, but this email is not marked as a paid member yet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not log in right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Log in to your calendar" eyebrow="Members">
      <form className="tds-auth-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />
        </label>
        {message ? <p className="tds-form-note">{message}</p> : null}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Checking..." : "Continue"}
        </button>
      </form>
      <button type="button" className="tds-link-button" onClick={() => navigateTo("/create-account")}>
        Already approved? Create your password
      </button>
      <button type="button" className="tds-link-button" onClick={() => navigateTo("/signup")}>
        Need a membership? Sign up
      </button>
    </AuthShell>
  );
};

const CreateAccountPage = ({ onMemberChange, onSessionChange }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords need to match.");
      setIsLoading(false);
      return;
    }

    try {
      const airtableMember = await fetchAirtableMember(email);
      if (!airtableMember?.paid) {
        setMessage("This email is not marked as an active member yet.");
        return;
      }

      const { session } = await signUpWithPassword(email, password);
      if (!session) {
        setMessage("Account created. Check your email to confirm it, then come back and log in.");
        return;
      }

      const nextMember = {
        ...airtableMember,
        email: session.user.email || email,
        authUserId: session.user.id
      };
      await saveSupabaseProfile(session, nextMember);
      setStoredMember(nextMember);
      onSessionChange(session);
      onMemberChange(nextMember);
      navigateTo(nextMember.profileComplete ? "/calendar" : "/profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the account right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Create your member password" eyebrow="Members">
      <p className="tds-auth-copy">
        Use this if you were added manually in Airtable or already paid through Stripe.
      </p>
      <form className="tds-auth-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </label>
        <label>
          Confirm Password
          <input
            required
            minLength={8}
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
          />
        </label>
        {message ? <p className="tds-form-note">{message}</p> : null}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <button type="button" className="tds-link-button" onClick={() => navigateTo("/login")}>
        Already have a password? Log in
      </button>
    </AuthShell>
  );
};

const businessNeighborhoods = [
  "Center City",
  "Fishtown",
  "Old City",
  "Rittenhouse",
  "South Philly",
  "Queens Village",
  "Northern Liberties",
  "Fairmount",
  "Manayunk",
  "West Philadelphia",
  "East Falls",
  "Cherry Hill, NJ",
  "Other"
];

const businessCategories = [
  "Mind-Body Practices",
  "Dance & Movement Arts",
  "Sports & Fitness",
  "Acrobatics & Circus Arts",
  "Creative Arts",
  "Martial Arts",
  "Recreation",
  "Food and Drinks",
  "Wellness & Recovery",
  "Climbing & Adventure",
  "Other"
];

const emptyBusinessForm = {
  fullName: "",
  email: "",
  role: "",
  businessName: "",
  address: "",
  neighborhood: [],
  website: "",
  instagram: "",
  category: [],
  classDesc: "",
  avgSize: "",
  price: "",
  booking: "",
  calendar: "",
  studioPerks: "",
  signature: "",
  mediaConsent: false,
  authConsent: false,
  listedConsent: false
};

const BusinessSignupPage = ({ member, onLogout }) => {
  const [form, setForm] = useState(emptyBusinessForm);
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleChoice = (field, value) => {
    setForm((current) => {
      const values = current[field];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      return { ...current, [field]: nextValues };
    });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitted(false);

    if (!form.fullName || !form.email || !form.businessName || !form.address) {
      setMessage("Add the required contact and studio details, then submit again.");
      return;
    }

    if (!form.neighborhood.length || !form.category.length) {
      setMessage("Choose at least one neighborhood and one category.");
      return;
    }

    if (!form.signature || !form.authConsent || !form.listedConsent) {
      setMessage("Add your signature and the required consents before submitting.");
      return;
    }

    setIsSubmitted(true);
    setMessage("Application ready. Connect this form to Airtable when your business table is set.");
  };

  return (
    <main className="tds-business-page">
      <AppNav member={member} onLogout={onLogout} />
      <section className="tds-business-hero">
        <div className="tds-business-hero-copy">
          <HeaderLogo />
          <span className="tds-business-eyebrow">For studios and wellness businesses</span>
          <h1>
            Get your classes in front of <em>Philadelphia adults</em> who are ready to move.
          </h1>
          <p>
            List your classes for adults 18+ on The Daily Session, from dance, fitness, yoga, art,
            cooking, and martial arts to other unique experiences. Connect with members already
            searching for what you offer.
          </p>
          <div className="tds-business-pills" aria-label="Business listing highlights">
            <span>Classes and workshops only</span>
            <span>18+ audience</span>
            <span>Member perks welcome</span>
          </div>
          <dl className="tds-business-proof">
            <div>
              <dt>50+</dt>
              <dd>studios listed</dd>
            </div>
            <div>
              <dt>100+</dt>
              <dd>members and growing</dd>
            </div>
            <div>
              <dt>Free</dt>
              <dd>listing for a limited time</dd>
            </div>
          </dl>
        </div>
        <aside className="tds-business-card" aria-label="Listing preview">
          <span>Free listing</span>
          <h2>Show up where people are already looking.</h2>
          <p>Send your details once. We review the fit, polish the listing, and keep discovery simple.</p>
        </aside>
      </section>

      <section className="tds-business-form-section">
        <div className="tds-business-form-heading">
          <span>The Daily Session</span>
          <h2>Get Your Studio Listed</h2>
          <p>Join our curated network of Philly studios, providers, and movement spaces.</p>
        </div>

        <form className="tds-business-form" onSubmit={onSubmit}>
          <fieldset>
            <legend>
              <span>01</span>
              Contact Information
            </legend>
            <div className="tds-business-grid">
              <label>
                Full Name *
                <input
                  required
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Tiffany Wright"
                />
              </label>
              <label>
                Email *
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@studio.com"
                />
              </label>
            </div>
            <label>
              Your Role at the Studio
              <input
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                placeholder="Owner, manager, instructor..."
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>
              <span>02</span>
              Studio Information
            </legend>
            <label>
              Studio / Business Name *
              <input
                required
                value={form.businessName}
                onChange={(event) => updateField("businessName", event.target.value)}
                placeholder="Your studio name"
              />
            </label>
            <label>
              Studio Address *
              <input
                required
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="123 Main St, Philadelphia PA"
              />
            </label>
            <div className="tds-business-choice-group">
              <span>Studio Neighborhood *</span>
              <div>
                {businessNeighborhoods.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={form.neighborhood.includes(item) ? "is-selected" : ""}
                    onClick={() => toggleChoice("neighborhood", item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="tds-business-grid">
              <label>
                Website
                <input
                  value={form.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  placeholder="https://"
                />
              </label>
              <label>
                Instagram / Social
                <input
                  value={form.instagram}
                  onChange={(event) => updateField("instagram", event.target.value)}
                  placeholder="@yourstudio"
                />
              </label>
            </div>
            <div className="tds-business-choice-group">
              <span>Category *</span>
              <div>
                {businessCategories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={form.category.includes(item) ? "is-selected" : ""}
                    onClick={() => toggleChoice("category", item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span>03</span>
              Classes and Schedule
            </legend>
            <label>
              Describe your classes
              <textarea
                value={form.classDesc}
                onChange={(event) => updateField("classDesc", event.target.value)}
                placeholder="List your main class types..."
              />
            </label>
            <div className="tds-business-grid">
              <label>
                Average Class Size
                <input
                  value={form.avgSize}
                  onChange={(event) => updateField("avgSize", event.target.value)}
                  placeholder="10-15 people"
                />
              </label>
              <label>
                Price Range per Class
                <input
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  placeholder="$20-$30 drop-in"
                />
              </label>
            </div>
            <div className="tds-business-grid">
              <label>
                Booking Platform
                <input
                  value={form.booking}
                  onChange={(event) => updateField("booking", event.target.value)}
                  placeholder="Mindbody, Vagaro, Momence..."
                />
              </label>
              <label>
                Public Calendar Link
                <input
                  value={form.calendar}
                  onChange={(event) => updateField("calendar", event.target.value)}
                  placeholder="Schedule URL"
                />
              </label>
            </div>
            <label>
              Studio Perks
              <textarea
                value={form.studioPerks}
                onChange={(event) => updateField("studioPerks", event.target.value)}
                placeholder="Free first class, percent off drop-in, member-only rate..."
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>
              <span>04</span>
              Signature
            </legend>
            <label>
              Typed Signature *
              <input
                required
                value={form.signature}
                onChange={(event) => updateField("signature", event.target.value)}
                placeholder="Type your full name"
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>
              <span>05</span>
              Consents
            </legend>
            <label className="tds-business-check">
              <input
                type="checkbox"
                checked={form.mediaConsent}
                onChange={(event) => updateField("mediaConsent", event.target.checked)}
              />
              I agree to allow The Daily Session to share media from my studio with appropriate
              credit and tagging.
            </label>
            <label className="tds-business-check">
              <input
                required
                type="checkbox"
                checked={form.authConsent}
                onChange={(event) => updateField("authConsent", event.target.checked)}
              />
              I confirm that I am authorized to represent this studio.
            </label>
            <label className="tds-business-check">
              <input
                required
                type="checkbox"
                checked={form.listedConsent}
                onChange={(event) => updateField("listedConsent", event.target.checked)}
              />
              I agree to be listed on The Daily Session calendar.
            </label>
          </fieldset>

          {message ? (
            <p className={isSubmitted ? "tds-business-success" : "tds-business-error"}>
              {message}
            </p>
          ) : null}
          <button type="submit" className="tds-business-submit">
            Submit Application
          </button>
        </form>
      </section>
    </main>
  );
};

const ProvidersPage = ({ member, onLogout }) => (
  <main className="tds-business-page">
    <AppNav member={member} onLogout={onLogout} />
    <section className="tds-provider-page">
      <span className="tds-business-eyebrow">For wellness providers</span>
      <h1>
        Provider partnerships are <em>coming next.</em>
      </h1>
      <p>
        This page will be for chiropractors, massage therapists, reiki practitioners,
        naturopaths, and other wellness providers who want to offer member perks.
      </p>
      <button type="button" onClick={() => navigateTo("/business")}>
        List a business for now
      </button>
    </section>
  </main>
);

const membershipPerks = [
  {
    color: "#c4572a",
    icon: "target",
    title: "Studio Discounts",
    desc: "First-class-free deals, percentage discounts, and member-only rates at 50+ partner studios across Philadelphia."
  },
  {
    color: "#3d5028",
    icon: "leaf",
    title: "Provider Discounts",
    desc: "Monthly discounts toward wellness providers: chiropractors, naturopaths, massage therapists, reiki practitioners, and more."
  },
  {
    color: "#e8a060",
    icon: "calendar",
    title: "Full 30-Day Calendar",
    desc: "Every class in the city, filterable by category, studio, neighborhood, level, price, and more."
  },
  {
    color: "#c4572a",
    icon: "map",
    title: "Everything in One Place",
    desc: "No more tab-hopping across studio websites. The Daily Session gathers classes, studios, and providers so you can just move."
  },
  {
    color: "#3d5028",
    icon: "bookmark",
    title: "Save Your Classes",
    desc: "Bookmark classes you want to revisit and keep your member dashboard organized around what you love."
  },
  {
    color: "#e8a060",
    icon: "sparkle",
    title: "Member Dashboard",
    desc: "Your personal hub for saved classes, membership details, and your Daily Session profile."
  }
];

const membershipChecklist = [
  ["Full calendar access", "All classes across all studios, updated daily."],
  ["Studio partner discounts", "First class free, 10-20% off, and member rates at 50+ studios."],
  ["Monthly wellness discounts", "Applies to chiropractic, massage, naturopathic, reiki, and somatic providers."],
  ["Save classes", "Bookmark any class and find it instantly in your dashboard."],
  ["Member dashboard", "Your personal hub for everything The Daily Session."],
  ["Cancel anytime", "No contracts. No commitment. Just movement."]
];

const pricingFeatures = [
  "Full 30-day class calendar",
  "Studio partner discounts at 50+ studios",
  "Monthly wellness provider discounts",
  "Save and manage your classes",
  "Member dashboard",
  "Cancel anytime"
];

const membershipFaqs = [
  [
    "How does the provider discount work?",
    "Each month you can book with participating wellness providers at the listed member rate. Discounts vary by provider and apply through the provider's own booking flow."
  ],
  [
    "Do I book classes through The Daily Session?",
    "No. The Daily Session is a guide and member hub, not a booking platform. We link you directly to each studio's booking page."
  ],
  [
    "Can I cancel anytime?",
    "Yes. No contracts or long-term commitment. You keep access until the end of your billing period."
  ],
  [
    "What is the difference between monthly and annual?",
    "Monthly is $5/month. Annual is $50/year, which works out to about $4/month and saves you two months."
  ],
  [
    "What kinds of classes are in the calendar?",
    "Mind-body practices, dance and movement arts, sports and fitness, acrobatics and circus arts, martial arts, creative arts, recreation, and food and drink experiences across Philadelphia."
  ]
];

const SectionKicker = ({ label, center = false }) => (
  <div className={`tds-section-kicker ${center ? "is-centered" : ""}`}>
    <span />
    {label}
  </div>
);

const PlanToggle = ({ plan, setPlan, theme = "light" }) => (
  <div className={`tds-join-plan-toggle is-${theme}`} role="group" aria-label="Membership plan">
    <button
      type="button"
      className={plan === "monthly" ? "is-selected" : ""}
      onClick={() => setPlan("monthly")}
    >
      Monthly
    </button>
    <button
      type="button"
      className={plan === "annual" ? "is-selected" : ""}
      onClick={() => setPlan("annual")}
    >
      Annual <span>Save 17%</span>
    </button>
  </div>
);

const SignupPage = () => {
  const [plan, setPlan] = useState("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const isAnnual = plan === "annual";
  const price = isAnnual ? "4.00" : "5";
  const ctaLabel = isAnnual ? "Become a Member - $50/yr" : "Become a Member - $5/mo";
  const cardCta = isAnnual ? "Start Annual Plan - $50/yr" : "Start Membership - $5/mo";

  const startCheckout = async (event) => {
    event?.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || "Checkout failed");
      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed");
      setIsLoading(false);
    }
  };

  return (
    <main className="tds-join-page">
      <AppNav />
      <section className="tds-join-hero">
        <div className="tds-join-glow" />
        <div className="tds-join-eyebrow">
          <span />
          The Daily Session - Philadelphia
          <span />
        </div>
        <h1>
          Everything moving
          <br />
          in <em>Philadelphia.</em>
        </h1>
        <p>
          One membership. Studio discounts, wellness provider discounts, and access to every class
          happening in the city - all in one place.
        </p>

        <PlanToggle plan={plan} setPlan={setPlan} theme="dark" />

        <div className="tds-join-price-band">
          <strong>${price}</strong>
          <span>/ month</span>
        </div>
        {isAnnual ? <small className="tds-join-billing-note">Billed as $50/year - two months free</small> : null}

        {error ? <p className="tds-join-error">{error}</p> : null}
        <button type="button" className="tds-join-cta" onClick={startCheckout} disabled={isLoading}>
          {isLoading ? "Opening Stripe..." : ctaLabel} <span>→</span>
        </button>
        <small className="tds-join-note">Cancel anytime - secure checkout via Stripe</small>
      </section>

      <section className="tds-join-stats" aria-label="Membership stats">
        <div>
          <strong>500+</strong>
          <span>Classes weekly</span>
        </div>
        <div>
          <strong>50+</strong>
          <span>Partner studios</span>
        </div>
        <div>
          <strong>10+</strong>
          <span>Participating providers</span>
        </div>
      </section>

      <section className="tds-join-section">
        <SectionKicker label="Why join" />
        <h2>
          Your city, <em>fully unlocked.</em>
        </h2>
        <p>
          The Daily Session is the only guide that covers everything moving in Philadelphia:
          yoga, dance, ceramics, circus, martial arts, and more.
        </p>
        <div className="tds-perk-grid">
          {membershipPerks.map((perk) => (
            <article className="tds-perk-card" key={perk.title} style={{ "--accent": perk.color }}>
              <span className={`tds-perk-icon is-${perk.icon}`} aria-hidden="true" />
              <h3>{perk.title}</h3>
              <p>{perk.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tds-included-section">
        <div>
          <SectionKicker label="What is included" />
          <h2>Everything a Philly mover needs.</h2>
          <p>
            From your first class to your hundredth, membership gives you the tools, savings,
            and discovery to keep moving.
          </p>
        </div>
        <div className="tds-included-list">
          {membershipChecklist.map(([title, desc]) => (
            <div className="tds-included-item" key={title}>
              <span>✓</span>
              <p>
                <strong>{title}</strong>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="tds-pricing-section">
        <SectionKicker label="Pricing" center />
        <h2>
          Simple. <em>Affordable.</em>
          <br />
          Worth it.
        </h2>
        <PlanToggle plan={plan} setPlan={setPlan} />

        <article className="tds-pricing-card">
          <header>
            <span>{isAnnual ? "Annual Membership" : "Monthly Membership"}</span>
            <h3>{isAnnual ? "Annual" : "Monthly"}</h3>
            <p>Everything you need to move through Philadelphia</p>
            <div>
              <small>$</small>
              <strong>{price}</strong>
              <small>/ month</small>
            </div>
            {isAnnual ? <p>Billed as $50/year - that is two months free</p> : null}
          </header>
          <div>
            {pricingFeatures.map((feature) => (
              <p className="tds-price-feature" key={feature}>
                <span>✓</span>
                {feature}
              </p>
            ))}
            {error ? <p className="tds-join-error">{error}</p> : null}
            <button type="button" className="tds-join-cta" onClick={startCheckout} disabled={isLoading}>
              {isLoading ? "Opening Stripe..." : cardCta} <span>→</span>
            </button>
            <small>Secure checkout via Stripe</small>
          </div>
        </article>
      </section>

      <section className="tds-faq-section">
        <SectionKicker label="FAQ" center />
        <h2>
          Common <em>questions.</em>
        </h2>
        <div className="tds-faq-list">
          {membershipFaqs.map(([question, answer], index) => {
            const isOpen = openFaq === index;
            return (
              <article className="tds-faq-item" key={question}>
                <button type="button" onClick={() => setOpenFaq(isOpen ? null : index)}>
                  {question}
                  <span>{isOpen ? "↑" : "↓"}</span>
                </button>
                {isOpen ? <p>{answer}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="tds-bottom-join">
        <h2>
          Ready to get off
          <br />
          the <em>couch?</em>
        </h2>
        <p>Philadelphia is moving. Join the members who are showing up for it.</p>
        <button type="button" className="tds-join-cta" onClick={startCheckout} disabled={isLoading}>
          {isLoading ? "Opening Stripe..." : ctaLabel} <span>→</span>
        </button>
        <div>
          <button type="button" onClick={() => setPlan("monthly")}>Monthly - $5/mo</button>
          <span>|</span>
          <button type="button" onClick={() => setPlan("annual")}>Annual - $50/yr</button>
        </div>
      </section>
    </main>
  );
};

const ProfilePage = ({ member, authSession, onMemberChange, onSessionChange }) => {
  const hasCheckoutSession = new URLSearchParams(window.location.search).has("session_id");
  const [status, setStatus] = useState("ready");
  const [statusMessage, setStatusMessage] = useState("");
  const [form, setForm] = useState({
    name: member?.name || "",
    email: member?.email || "",
    pronouns: member?.pronouns || "",
    birthday: member?.birthday || "",
    instagram: member?.instagram || "",
    neighborhood: member?.neighborhood || "",
    heard: member?.heard || "",
    interests: member?.interests || "",
    experience: member?.experience || "",
    bio: member?.bio || "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    setStatus("verifying");
    fetch(`/api/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.paid) throw new Error("Payment was not completed");
        const nextMember = {
          ...getStoredMember(),
          ...(payload.member || {}),
          paid: true,
          email: payload.email || form.email,
          stripeCustomerId: payload.customerId,
          stripeSubscriptionId: payload.subscriptionId
        };
        setStoredMember(nextMember);
        onMemberChange(nextMember);
        setForm((current) => ({ ...current, email: nextMember.email || current.email }));
        setStatus("ready");
        window.history.replaceState({}, "", "/profile");
      })
      .catch(() => setStatus("error"));
  }, []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    if (!member?.paid) {
      setStatus("error");
      setStatusMessage("This email is not marked as a paid member yet.");
      return;
    }

    setStatus("saving");
    const needsAccount = !authSession?.user?.id;
    if (needsAccount && form.password !== form.confirmPassword) {
      setStatus("password-error");
      return;
    }

    try {
      let session = authSession;
      if (needsAccount) {
        const created = await signUpWithPassword(form.email, form.password);
        session = created.session;
        if (!session) {
          setStatus("confirm-email");
          return;
        }
        onSessionChange(session);
      }

      await saveSupabaseProfile(session, {
        ...member,
        ...form,
        profileComplete: true
      });

      const profileMember = {
        ...member,
        ...form,
        paid: true,
        profileComplete: true
      };
      let nextMember = profileMember;

      try {
        nextMember = await saveMember(profileMember);
      } catch (airtableError) {
        console.warn("Airtable profile mirror failed", airtableError);
      }

      const mergedMember = {
        ...profileMember,
        ...nextMember,
        authUserId: session.user.id,
        hasPassword: true
      };
      setStoredMember(mergedMember);
      onMemberChange(mergedMember);
      navigateTo("/calendar");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Something did not save correctly.");
    }
  };

  if (!member?.paid && !hasCheckoutSession) {
    return (
      <AuthShell title="Complete checkout first" eyebrow="Profile">
        <p className="tds-auth-copy">
          After your Stripe membership payment, you can finish your profile and open the full calendar.
        </p>
        <button type="button" className="tds-auth-main-button" onClick={() => navigateTo("/signup")}>
          Continue to Membership
        </button>
      </AuthShell>
    );
  }

  return (
    <main className="tds-profile-page">
      <form className="tds-profile-card" onSubmit={saveProfile}>
        <aside className="tds-profile-intro">
          <BrandLockup />
          <span className="tds-profile-kicker">Member profile</span>
          <h1>Hi {form.name || "there"}.</h1>
          <p>
            Tell us enough to make your calendar feel personal, then jump straight
            into the full month of classes.
          </p>
          <div className="tds-profile-next">
            <span>After this</span>
            <strong>Browse by date, studio, neighborhood, and class type.</strong>
          </div>
        </aside>

        <section className="tds-profile-form">
          <div className="tds-profile-form-head">
            <span>Welcome to The Daily Session</span>
            <h2>Set up your member space</h2>
            <p>No endless searching. No scattered schedules. Just real experiences, happening today.</p>
          </div>

          <div className="tds-profile-status" aria-live="polite">
            {status === "verifying" ? <p className="tds-form-note">Verifying Stripe payment...</p> : null}
            {status === "saving" ? <p className="tds-form-note">Saving your profile...</p> : null}
            {status === "password-error" ? <p className="tds-form-error">Passwords need to match.</p> : null}
            {status === "confirm-email" ? <p className="tds-form-note">Account created. Check your email to confirm it, then log in.</p> : null}
            {status === "error" ? (
              <p className="tds-form-error">
                {statusMessage || "Something did not save correctly. Try again in a moment."}
              </p>
            ) : null}
          </div>

          <fieldset className="tds-profile-section">
            <legend>Basics</legend>
            <div className="tds-profile-grid">
              <label>
                Name
                <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Name" />
              </label>
              <label>
                Pronouns
                <input value={form.pronouns} onChange={(event) => updateField("pronouns", event.target.value)} placeholder="Pronouns" />
              </label>
              <label>
                Birthday
                <input type="date" value={form.birthday} onChange={(event) => updateField("birthday", event.target.value)} />
              </label>
              <label>
                Instagram
                <input value={form.instagram} onChange={(event) => updateField("instagram", event.target.value)} placeholder="@username" />
              </label>
            </div>
          </fieldset>

          <fieldset className="tds-profile-section">
            <legend>Class preferences</legend>
            <div className="tds-profile-grid">
              <label>
                Neighborhood
                <select value={form.neighborhood} onChange={(event) => updateField("neighborhood", event.target.value)}>
                  <option value="">Neighborhood</option>
                  <option>Center City</option>
                  <option>Fishtown</option>
                  <option>South Philly</option>
                  <option>West Philly</option>
                  <option>Rittenhouse</option>
                </select>
              </label>
              <label>
                Interests
                <select value={form.interests} onChange={(event) => updateField("interests", event.target.value)}>
                  <option value="">Interests</option>
                  <option>Yoga and pilates</option>
                  <option>Dance and movement</option>
                  <option>Creative arts</option>
                  <option>Fitness</option>
                </select>
              </label>
              <label>
                Experience Level
                <select value={form.experience} onChange={(event) => updateField("experience", event.target.value)}>
                  <option value="">Experience</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>All levels</option>
                </select>
              </label>
              <label>
                How did you hear about us?
                <select value={form.heard} onChange={(event) => updateField("heard", event.target.value)}>
                  <option value="">Select one</option>
                  <option>Instagram</option>
                  <option>Friend</option>
                  <option>Studio</option>
                  <option>Search</option>
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className="tds-profile-section">
            <legend>About you</legend>
            <label>
              Bio
              <textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} placeholder="A little about what you like, what you are trying, or what you want to find more of." />
            </label>
          </fieldset>

          {!authSession?.user?.id ? (
            <fieldset className="tds-profile-section">
              <legend>Account</legend>
              <div className="tds-profile-passwords">
                <label>
                  Create Password
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="At least 8 characters"
                  />
                </label>
                <label>
                  Confirm Password
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    placeholder="Confirm"
                  />
                </label>
              </div>
            </fieldset>
          ) : null}

          <div className="tds-profile-actions">
            <button type="submit" disabled={!member?.paid || status === "verifying" || status === "saving"}>
              {status === "verifying" ? "Verifying..." : status === "saving" ? "Saving..." : "Begin Browsing"}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
};

const getMonthMatrix = (date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

const CalendarHero = () => (
  <section className="tds-page-header-shell">
    <div className="tds-page-header-card">
      <div>
        <BrandLockup />
        <span className="tds-page-header-kicker">Monthly Calendar</span>
        <h1>
          Explore what's <em>happening</em> this month.
        </h1>
        <p>
          Browse classes across Philadelphia by category, studio, neighborhood, level,
          and price - all in one place.
        </p>
      </div>
    </div>
  </section>
);

const DetailStat = ({ label, value }) => {
  if (!value) return null;

  return (
    <div className="tds-class-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
};

const ClassDetailsPage = ({ member, authSession, activeSessions, onLogout, classId }) => {
  if (!member?.paid || !authSession?.user?.id) {
    return (
      <AuthShell title="Members only details" eyebrow="Locked">
        <p className="tds-auth-copy">
          Log in with your member password to view full class details.
        </p>
        <button type="button" className="tds-auth-main-button" onClick={() => navigateTo("/signup")}>
          Join to View Details
        </button>
        <button type="button" className="tds-link-button" onClick={() => navigateTo("/login")}>
          Already joined? Log in
        </button>
      </AuthShell>
    );
  }

  const decodedId = decodeURIComponent(classId || "");
  const session = activeSessions.find(
    (item) => item.id === decodedId || item.recordId === decodedId
  );

  if (!session) {
    return (
      <main className="tds-class-page">
        <AppNav member={member} onLogout={onLogout} />
        <section className="tds-class-empty">
          <BrandLockup />
          <h1>Class details are still loading.</h1>
          <p>
            Give the calendar a moment to catch up, or return to the full calendar and choose the class again.
          </p>
          <button type="button" onClick={() => navigateTo("/calendar")}>
            Return to Calendar
          </button>
        </section>
      </main>
    );
  }

  const price = getSessionPrice(session);
  const tags = [
    ...normalizeDetailList(session.subcategory),
    ...normalizeDetailList(session.tags),
    ...normalizeDetailList(session.moodMatcher),
    ...normalizeDetailList(session.energyLevel),
    ...normalizeDetailList(session.outcomeBenefit)
  ];

  return (
    <main className="tds-class-page">
      <AppNav member={member} onLogout={onLogout} />
      <section className="tds-class-detail-shell">
        <article className="tds-class-detail-card">
          <div className="tds-class-hero">
            {session.photo ? (
              <img src={session.photo} alt="" />
            ) : (
              <div className="tds-class-photo-placeholder">
                <MiniCalendarLogo />
              </div>
            )}
            <div>
              <button type="button" onClick={() => navigateTo("/calendar")}>
                Back to Calendar
              </button>
              <span>{session.category}</span>
              <h1>{session.title}</h1>
              <p>{session.studio}</p>
            </div>
          </div>

          <div className="tds-class-body">
            <div className="tds-class-stat-grid">
              <DetailStat label="Date and Time" value={formatSessionDateTime(session)} />
              <DetailStat label="Price" value={price} />
              <DetailStat label="Location" value={session.address || session.neighborhood} />
              <DetailStat label="Level" value={session.level} />
            </div>

            {tags.length ? (
              <div className="tds-class-tags">
                {tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}

            <div className="tds-class-content-grid">
              <section>
                <span>About This Class</span>
                <p>
                  {session.description ||
                    "Details are still being gathered for this class. Check the studio signup page for the most current notes."}
                </p>
              </section>

              <aside>
                {session.reminder ? (
                  <div className="tds-class-reminder">
                    <span>Good to know</span>
                    <p>{session.reminder}</p>
                  </div>
                ) : null}

                <div className="tds-class-actions">
                  {session.studioSite ? (
                    <a href={session.studioSite} target="_blank" rel="noreferrer">
                      Sign Up for This Class
                    </a>
                  ) : null}
                  {session.googleCalendarLink ? (
                    <a href={session.googleCalendarLink} target="_blank" rel="noreferrer">
                      Add to Google Calendar
                    </a>
                  ) : null}
                  <button type="button" onClick={() => navigateTo("/calendar")}>
                    Return to Calendar
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
};

const CalendarPage = ({ member, authSession, activeSessions, onLogout }) => {
  const [category, setCategory] = useState("all");
  const [studio, setStudio] = useState("all");
  const [neighborhood, setNeighborhood] = useState("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => getEasternDateKey(new Date()));

  if (!member?.paid || !authSession?.user?.id) {
    return (
      <AuthShell title="Members only calendar" eyebrow="Locked">
        <p className="tds-auth-copy">
          Log in with your member password to unlock the full monthly calendar.
        </p>
        <button type="button" className="tds-auth-main-button" onClick={() => navigateTo("/signup")}>
          Join to View Calendar
        </button>
        <button type="button" className="tds-link-button" onClick={() => navigateTo("/login")}>
          Already joined? Log in
        </button>
      </AuthShell>
    );
  }

  const categories = ["all", ...Array.from(new Set(activeSessions.map((session) => session.category))).sort()];
  const studios = ["all", ...Array.from(new Set(activeSessions.map((session) => session.studio))).sort()];
  const neighborhoods = [
    "all",
    ...Array.from(new Set(activeSessions.map((session) => session.neighborhood).filter(Boolean))).sort()
  ];
  const filtered = activeSessions
    .filter((session) => category === "all" || session.category === category)
    .filter((session) => studio === "all" || session.studio === studio)
    .filter((session) => neighborhood === "all" || session.neighborhood === neighborhood)
    .filter((session) => {
      const haystack = `${session.title} ${session.studio} ${session.neighborhood}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    })
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const monthDays = getMonthMatrix(calendarMonth);
  const monthLabel = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthClassCount = filtered.filter(
    (session) =>
      session.startDate.getFullYear() === calendarMonth.getFullYear() &&
      session.startDate.getMonth() === calendarMonth.getMonth()
  ).length;
  const sessionsByDay = filtered.reduce((acc, session) => {
    const key = getEasternDateKey(session.startDate);
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(session);
    return acc;
  }, new Map());
  const selectedItems = sessionsByDay.get(selectedDateKey) || [];
  const selectedDate = new Date(`${selectedDateKey}T12:00:00`);

  const shiftMonth = (amount) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <main className="tds-calendar-page">
      <AppNav member={member} onLogout={onLogout} />
      <CalendarHero />
      <section className="tds-calendar-tools">
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
        <select value={studio} onChange={(event) => setStudio(event.target.value)}>
          {studios.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All Studios" : item}
            </option>
          ))}
        </select>
        <select value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)}>
          {neighborhoods.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All Neighborhoods" : item}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search classes"
        />
        <span>{filtered.length} classes found</span>
        <div className="tds-view-toggle" aria-label="Calendar view">
          <button type="button" className={viewMode === "grid" ? "is-active" : ""} onClick={() => setViewMode("grid")}>
            Grid
          </button>
          <button type="button" className={viewMode === "list" ? "is-active" : ""} onClick={() => setViewMode("list")}>
            List
          </button>
        </div>
      </section>

      <section className={`tds-calendar-board ${viewMode === "list" ? "is-list" : ""}`}>
        <div className="tds-month-panel">
          <div className="tds-month-head">
            <div>
              <h2>{monthLabel}</h2>
              <p>{monthClassCount} matching classes this month</p>
            </div>
            <div>
              <button type="button" onClick={() => shiftMonth(-1)}>‹</button>
              <button type="button" onClick={() => setCalendarMonth(new Date())}>Today</button>
              <button type="button" onClick={() => shiftMonth(1)}>›</button>
            </div>
          </div>
          <div className="tds-month-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="tds-month-grid">
            {monthDays.map((day) => {
              const key = getEasternDateKey(day);
              const items = sessionsByDay.get(key) || [];
              const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
              const isSelected = key === selectedDateKey;

              return (
                <button
                  type="button"
                  className={`${isSelected ? "is-selected" : ""} ${!isCurrentMonth ? "is-muted" : ""}`}
                  key={key}
                  onClick={() => setSelectedDateKey(key)}
                >
                  <span>{day.getDate()}</span>
                  {items.length ? <strong>{items.length}</strong> : null}
                  <div>
                    {items.slice(0, 7).map((session) => (
                      <i key={session.id} style={{ background: getCategoryPillStyle(session.category).color }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="tds-day-panel">
          <div className="tds-day-head">
            <div>
              <h2>{formatEasternHeaderDate(selectedDate)}</h2>
              <p>{selectedItems.length} classes</p>
            </div>
          </div>
          {selectedItems.length === 0 ? (
            <div className="tds-empty-state">
              <strong>No classes on this date</strong>
              <span>Try a nearby day or loosen the filters.</span>
            </div>
          ) : (
            <div className="tds-day-list">
              {selectedItems.map((session) => (
                <article className="tds-day-card" key={session.id}>
                  <div
                    className="tds-day-thumb"
                    data-has-photo={session.photo ? "true" : "false"}
                    style={{
                      backgroundImage: session.photo ? `url(${session.photo})` : "none"
                    }}
                    aria-hidden="true"
                  />
                  <div>
                    <span>{session.category}</span>
                    <h3>{session.title}</h3>
                    <p>{session.studio}</p>
                    <small>{formatEasternTime(session.startDate)}{session.neighborhood ? ` · ${session.neighborhood}` : ""}</small>
                  </div>
                  <div>
                    <button type="button" onClick={() => navigateTo(getSessionDetailPath(session))}>
                      View Details
                    </button>
                    {session.studioSite ? (
                      <a href={session.studioSite} target="_blank" rel="noreferrer">
                        Sign Up
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
};

const ScheduleSection = ({ now, activeSessions, dataStatus }) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const [modalSessionId, setModalSessionId] = useState(null);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeFilter]);

  useEffect(() => {
    if (!modalSessionId) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setModalSessionId(null);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalSessionId]);

  const todayKey = useMemo(() => getEasternDateKey(now), [now]);

  const todayItems = useMemo(
    () =>
      activeSessions
        .filter(
          (session) =>
            getEasternDateKey(session.startDate) === todayKey &&
            session.startDate.getTime() >= now.getTime()
        )
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    [activeSessions, todayKey, now]
  );

  const filterOptions = useMemo(() => {
    const labels = new Set();
    todayItems.forEach((session) => labels.add(session.category));
    return ["all", ...Array.from(labels).sort((a, b) => a.localeCompare(b))];
  }, [todayItems]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return todayItems;
    return todayItems.filter((session) => session.category === activeFilter);
  }, [todayItems, activeFilter]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

  const groupedItems = useMemo(() => {
    const groups = new Map();

    visibleItems.forEach((session) => {
      const timeLabel = formatEasternTime(session.startDate);
      if (!groups.has(timeLabel)) groups.set(timeLabel, []);
      groups.get(timeLabel).push(session);
    });

    return Array.from(groups.entries());
  }, [visibleItems]);

  const selectedSession = useMemo(
    () => activeSessions.find((session) => session.id === modalSessionId),
    [activeSessions, modalSessionId]
  );

  const hasMoreToShow = visibleCount < filteredItems.length;

  return (
    <section className="tds-schedule" aria-labelledby="tds-schedule-heading">
      <div className="tds-schedule-inner">
        <div className="tds-schedule-header">
          <div>
            <h2 id="tds-schedule-heading">Today's Classes</h2>
            <p>{formatEasternHeaderDate(now)}</p>
            <p>
              {dataStatus.loading
                ? "Loading the live class list."
                : dataStatus.error
                  ? "Live classes are temporarily unavailable."
                  : `Showing ${visibleItems.length} ${visibleItems.length === 1 ? "class" : "classes"}${activeFilter !== "all" ? ` in ${activeFilter}` : ""}${hasMoreToShow ? " - load more below." : ""}`}
            </p>
          </div>
        </div>

        {dataStatus.loading ? (
          <div className="tds-empty-state">
            <strong>All these classes are exhausting.</strong>
            <span>Give the calendar a second to stretch before it starts listing everything.</span>
          </div>
        ) : dataStatus.error ? (
          <div className="tds-empty-state">
            <strong>The class list is catching its breath.</strong>
            <span>Refresh in a moment, or check the Airtable token if it keeps resting.</span>
          </div>
        ) : (
          <>
            <div className="tds-filter-row" aria-label="Class filters">
              {filterOptions.map((filter) => {
                const isActive = activeFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={isActive ? "is-active" : ""}
                  >
                    {filter === "all" ? "All Classes" : filter}
                  </button>
                );
              })}
            </div>

            {visibleItems.length === 0 ? (
          <div className="tds-empty-state">
            <strong>No remaining classes for today</strong>
            <span>Try selecting a different category.</span>
          </div>
        ) : (
          <div className="tds-session-groups">
            {groupedItems.map(([timeLabel, timeItems]) => (
              <div className="tds-session-group" key={timeLabel}>
                <div className="tds-time-row">
                  <span>{timeLabel}</span>
                  <div />
                </div>

                <div className="tds-session-list">
                  {timeItems.map((session) => {
                    const pill = getCategoryPillStyle(session.category);

                    return (
                      <article className="tds-session-card" key={session.id}>
                        <div
                          className="tds-session-photo"
                          style={{
                            backgroundImage: session.photo
                              ? `url(${session.photo})`
                              : "none"
                          }}
                          aria-hidden="true"
                        />

                        <div className="tds-session-main">
                          <div className="tds-session-meta">
                            <span
                              style={{
                                backgroundColor: pill.background,
                                color: pill.color,
                                borderColor: pill.border
                              }}
                            >
                              {session.category}
                            </span>
                            {session.neighborhood ? <small>{session.neighborhood}</small> : null}
                          </div>

                          <h3>{session.title}</h3>
                          <p>{session.studio}</p>
                        </div>

                        <div className="tds-session-actions">
                          <button type="button" onClick={() => setModalSessionId(session.id)}>
                            Details
                          </button>
                          {session.studioSite ? (
                            <a href={session.studioSite} target="_blank" rel="noreferrer">
                              Sign Up
                            </a>
                          ) : (
                            <span>Sign up unavailable</span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}

            {hasMoreToShow ? (
              <div className="tds-load-more">
                <button type="button" onClick={() => setVisibleCount((count) => count + 10)}>
                  Load More Classes
                </button>
              </div>
            ) : null}
          </div>
        )}
          </>
        )}
      </div>

      {selectedSession ? (
        <div className="tds-modal-backdrop" onClick={() => setModalSessionId(null)}>
          <div className="tds-modal" onClick={(event) => event.stopPropagation()}>
            <div className="tds-modal-header">
              <div>
                <span>{formatEasternTime(selectedSession.startDate)}</span>
                <h3>{selectedSession.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalSessionId(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>
            <div className="tds-modal-body">
              {selectedSession.photo ? (
                <img src={selectedSession.photo} alt="" />
              ) : null}
              <div>
                <span>{selectedSession.category}</span>
                <p>{selectedSession.studio}</p>
                {selectedSession.neighborhood ? <p>{selectedSession.neighborhood}</p> : null}
                {selectedSession.studioSite ? (
                  <a href={selectedSession.studioSite} target="_blank" rel="noreferrer">
                    Sign Up
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [member, setMember] = useState(() => getStoredMember());
  const [authSession, setAuthSession] = useState(() => getStoredSupabaseSession());
  const [now, setNow] = useState(() => floorToMinute(new Date()));
  const [sessions, setSessions] = useState([]);
  const [dataStatus, setDataStatus] = useState({
    source: "airtable",
    count: 0,
    error: "",
    loading: true
  });
  const [displayToday, setDisplayToday] = useState("0");
  const [displayTomorrow, setDisplayTomorrow] = useState("0");
  const [displayStudios, setDisplayStudios] = useState("0");

  const animationCleanupRef = useRef({
    today: null,
    tomorrow: null,
    studios: null
  });

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      setMember(getStoredMember());
      setAuthSession(getStoredSupabaseSession());
    };

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const storedSession = getStoredSupabaseSession();
    if (!storedSession) return undefined;

    refreshSupabaseSession(storedSession)
      .then(async (session) => {
        if (!session || !isMounted) return;
        setAuthSession(session);
        const authenticatedMember = await loadAuthenticatedMember(session);
        if (!isMounted || !authenticatedMember) return;
        setStoredMember(authenticatedMember);
        setMember(authenticatedMember);
      })
      .catch(() => {
        clearStoredSupabaseSession();
        clearStoredMember();
        if (isMounted) {
          setAuthSession(null);
          setMember(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await signOut(authSession);
    setAuthSession(null);
    setMember(null);
    navigateTo("/");
  };

  useEffect(() => {
    const syncToMinute = () => setNow(floorToMinute(new Date()));
    const msUntilNextMinute = 60000 - (Date.now() % 60000);

    const timeoutId = window.setTimeout(() => {
      syncToMinute();
      const intervalId = window.setInterval(syncToMinute, 60000);
      animationCleanupRef.current.minuteInterval = intervalId;
    }, msUntilNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (animationCleanupRef.current.minuteInterval) {
        window.clearInterval(animationCleanupRef.current.minuteInterval);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/sessions")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load Airtable sessions");
        return response.json();
      })
      .then((payload) => {
        if (!isMounted || !Array.isArray(payload.sessions)) return;
        setSessions(payload.sessions);
        setDataStatus({
          source: payload.source || "airtable",
          count: payload.count || payload.sessions.length,
          error: "",
          loading: false
        });
      })
      .catch((error) => {
        if (isMounted) setSessions([]);
        if (isMounted) {
          setDataStatus({
            source: "airtable",
            count: 0,
            error: error instanceof Error ? error.message : "Airtable unavailable",
            loading: false
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const todayKey = useMemo(() => getEasternDateKey(now), [now]);
  const tomorrowKey = useMemo(() => getEasternDateKey(addDays(now, 1)), [now]);

  const activeSessions = useMemo(
    () =>
      sessions
        .filter((session) => !isCancelled(session.status))
        .map(normalizeSession)
        .filter((session) => !Number.isNaN(session.startDate.getTime())),
    [sessions]
  );

  const todayCount = useMemo(
    () =>
      activeSessions.filter(
        (session) =>
          getEasternDateKey(session.startDate) === todayKey &&
          session.startDate.getTime() >= now.getTime()
      ).length,
    [activeSessions, todayKey, now]
  );

  const tomorrowCount = useMemo(
    () =>
      activeSessions.filter(
        (session) => getEasternDateKey(session.startDate) === tomorrowKey
      ).length,
    [activeSessions, tomorrowKey]
  );

  useEffect(() => {
    if (animationCleanupRef.current.today) animationCleanupRef.current.today();
    if (animationCleanupRef.current.tomorrow) animationCleanupRef.current.tomorrow();

    animationCleanupRef.current.today = animateNumber(
      Number(displayToday),
      todayCount,
      setDisplayToday,
      700
    );
    animationCleanupRef.current.tomorrow = animateNumber(
      Number(displayTomorrow),
      tomorrowCount,
      setDisplayTomorrow,
      850
    );

    return () => {
      if (animationCleanupRef.current.today) animationCleanupRef.current.today();
      if (animationCleanupRef.current.tomorrow) animationCleanupRef.current.tomorrow();
    };
  }, [todayCount, tomorrowCount]);

  useEffect(() => {
    animationCleanupRef.current.studios = animateNumber(
      0,
      FIXED_STUDIO_COUNT,
      setDisplayStudios,
      1000
    );

    return () => {
      if (animationCleanupRef.current.studios) animationCleanupRef.current.studios();
    };
  }, []);

  const currentDate = useMemo(() => formatEasternLongDate(now), [now]);
  const headingParts = content.mainHeading.split(" ");

  if (path === "/login") {
    return <LoginPage onMemberChange={setMember} onSessionChange={setAuthSession} />;
  }

  if (path === "/signup") {
    return <SignupPage />;
  }

  if (path === "/business") {
    return <BusinessSignupPage member={member} onLogout={handleLogout} />;
  }

  if (path === "/providers") {
    return <ProvidersPage member={member} onLogout={handleLogout} />;
  }

  if (path === "/create-account") {
    return <CreateAccountPage onMemberChange={setMember} onSessionChange={setAuthSession} />;
  }

  if (path === "/profile") {
    return (
      <ProfilePage
        member={member}
        authSession={authSession}
        onMemberChange={setMember}
        onSessionChange={setAuthSession}
      />
    );
  }

  if (path.startsWith("/class/") || path === "/class-info") {
    const classId =
      path === "/class-info"
        ? new URLSearchParams(window.location.search).get("recordId") ||
          new URLSearchParams(window.location.search).get("record_id") ||
          new URLSearchParams(window.location.search).get("classRecordId") ||
          ""
        : path.replace(/^\/class\//, "");

    return (
      <ClassDetailsPage
        member={member}
        authSession={authSession}
        activeSessions={activeSessions}
        onLogout={handleLogout}
        classId={classId}
      />
    );
  }

  if (path === "/calendar") {
    return (
      <CalendarPage
        member={member}
        authSession={authSession}
        activeSessions={activeSessions}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main className="tds-page">
      <AppNav member={member} onLogout={handleLogout} />
      <section className="tds-hero" aria-labelledby="tds-heading">
        <div className="tds-copy">
          <BrandLockup />

          <div className="tds-pill">
            <span className="tds-pill-dot" />
            <span>{content.headerLabel}</span>
          </div>

          <h1 id="tds-heading">
            {headingParts.map((word, index) =>
              word.toLowerCase() === "moving" ? (
                <em key={`${word}-${index}`}>{word} </em>
              ) : (
                <span key={`${word}-${index}`}>{word} </span>
              )
            )}
          </h1>

          <p>{content.description}</p>
        </div>

        <aside className="tds-panel" aria-label="Daily session statistics">
          <StatsCard label="REMAINING CLASSES TODAY" value={displayToday} />
          <div className="tds-divider" />
          <StatsCard label="TOMORROW" value={displayTomorrow} />
          <div className="tds-divider" />
          <StatsCard
            label="STUDIOS IN NETWORK"
            value={displayStudios}
            description={content.studiosDescription}
          />

          <div className="tds-updated">
            <span />
            <p>
              Updated live · {currentDate.split(",")[0]}, {formatEasternMonthDay(now)}
            </p>
          </div>
        </aside>
      </section>

      <ScheduleSection
        now={now}
        activeSessions={activeSessions}
        dataStatus={dataStatus}
      />
    </main>
  );
}
