import { useEffect, useMemo, useRef, useState } from "react";
import fallbackSessions from "./data/sessions.json";

const EASTERN_TZ = "America/New_York";
const FIXED_STUDIO_COUNT = 51;

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
    <MiniCalendarLogo />
    <div className="tds-brand-text">
      <span className="tds-brand-kicker">The</span>
      <span className="tds-brand-name">Daily Session</span>
      <span className="tds-brand-line" />
      <span className="tds-brand-location">Philadelphia</span>
    </div>
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
  neighborhood: session.neighborhood || "",
  level: session.level || "",
  dropInRate: session.dropInRate || session.rate || "",
  description: session.description || "",
  startDate: new Date(session.start)
});

const navigateTo = (path) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const getStoredMember = () => {
  try {
    return JSON.parse(window.localStorage.getItem("tdsMember") || "null");
  } catch {
    return null;
  }
};

const setStoredMember = (member) => {
  window.localStorage.setItem("tdsMember", JSON.stringify(member));
};

const HeaderLogo = () => (
  <button type="button" className="tds-nav-logo" onClick={() => navigateTo("/")}>
    <MiniCalendarLogo />
    <span>The Daily Session</span>
  </button>
);

const AppNav = ({ member }) => (
  <nav className="tds-nav" aria-label="Main navigation">
    <HeaderLogo />
    <div>
      <button type="button" onClick={() => navigateTo("/")}>
        Home
      </button>
      <button type="button" onClick={() => navigateTo("/calendar")}>
        Calendar
      </button>
      {member ? (
        <button type="button" onClick={() => navigateTo("/profile")}>
          Profile
        </button>
      ) : (
        <>
          <button type="button" onClick={() => navigateTo("/login")}>
            Log In
          </button>
          <button type="button" className="tds-nav-primary" onClick={() => navigateTo("/signup")}>
            Join
          </button>
        </>
      )}
    </div>
  </nav>
);

const AuthShell = ({ title, eyebrow, children }) => (
  <main className="tds-auth-page">
    <div className="tds-auth-card">
      <HeaderLogo />
      <span className="tds-auth-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children}
    </div>
  </main>
);

const LoginPage = ({ onMemberChange }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();
    const member = getStoredMember();

    if (member?.paid && (!email || member.email === email)) {
      onMemberChange(member);
      navigateTo(member.profileComplete ? "/calendar" : "/profile");
      return;
    }

    setMessage("No paid membership found on this browser yet. Join to start checkout.");
  };

  return (
    <AuthShell title="Log in to your calendar" eyebrow="Members">
      <form className="tds-auth-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        {message ? <p className="tds-form-note">{message}</p> : null}
        <button type="submit">Continue</button>
      </form>
      <button type="button" className="tds-link-button" onClick={() => navigateTo("/signup")}>
        Need a membership? Sign up
      </button>
    </AuthShell>
  );
};

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
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
    <AuthShell title="Join The Daily Session" eyebrow="Membership">
      <p className="tds-auth-copy">
        Unlock the full monthly calendar, filters, class details, and member profile.
      </p>
      <form className="tds-auth-form" onSubmit={startCheckout}>
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
        {error ? <p className="tds-form-error">{error}</p> : null}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Opening Stripe..." : "Continue to Secure Checkout"}
        </button>
      </form>
      <button type="button" className="tds-link-button" onClick={() => navigateTo("/login")}>
        Already joined? Log in
      </button>
    </AuthShell>
  );
};

const ProfilePage = ({ member, onMemberChange }) => {
  const hasCheckoutSession = new URLSearchParams(window.location.search).has("session_id");
  const [status, setStatus] = useState("ready");
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
    bio: member?.bio || ""
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

  const saveProfile = (event) => {
    event.preventDefault();
    if (!member?.paid) {
      setStatus("error");
      return;
    }

    const nextMember = {
      ...member,
      ...form,
      profileComplete: true
    };
    setStoredMember(nextMember);
    onMemberChange(nextMember);
    navigateTo("/calendar");
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
        <h1>Hi {form.name || "there"}</h1>
        <h2>Welcome to The Daily Session!</h2>
        <p>
          Your daily guide to movement, wellness, and creative classes happening around
          Philadelphia.
        </p>
        <p>No endless searching.<br />No scattered schedules.<br />Just real experiences, happening today.</p>
        <h3>Please answer a few questions to complete your profile</h3>
        {status === "verifying" ? <p className="tds-form-note">Verifying Stripe payment...</p> : null}
        {status === "error" ? <p className="tds-form-error">Could not verify payment. Try checkout again.</p> : null}

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
          How did you hear about us?
          <select value={form.heard} onChange={(event) => updateField("heard", event.target.value)}>
            <option value="">Select one</option>
            <option>Instagram</option>
            <option>Friend</option>
            <option>Studio</option>
            <option>Search</option>
          </select>
        </label>
        <label>
          What interests you?
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
          Tell us a little bit about yourself!
          <textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} placeholder="Bio" />
        </label>
        <button type="submit" disabled={!member?.paid || status === "verifying"}>
          {status === "verifying" ? "Verifying..." : "Begin Browsing"}
        </button>
      </form>
    </main>
  );
};

const PageHeader = () => (
  <section className="tds-page-header-shell">
    <div className="tds-page-header-card">
      <div>
        <BrandLockup />
        <span className="tds-page-header-kicker">Monthly Calendar</span>
        <h1>Explore what's happening this month.</h1>
        <p>
          Browse classes across Philadelphia by category, studio, neighborhood, level,
          and price, all in one place.
        </p>
      </div>
      <aside>
        <span>Inside this page</span>
        <h2>Find your next class faster</h2>
        <p>Use the filters to narrow your options, then browse the month your way.</p>
      </aside>
    </div>
  </section>
);

const CalendarPage = ({ member, activeSessions }) => {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);

  if (!member?.paid) {
    return (
      <AuthShell title="Members only calendar" eyebrow="Locked">
        <p className="tds-auth-copy">
          Purchase a membership to unlock the full monthly calendar.
        </p>
        <button type="button" className="tds-auth-main-button" onClick={() => navigateTo("/signup")}>
          Join to View Calendar
        </button>
      </AuthShell>
    );
  }

  const categories = ["all", ...Array.from(new Set(activeSessions.map((session) => session.category))).sort()];
  const filtered = activeSessions
    .filter((session) => category === "all" || session.category === category)
    .filter((session) => {
      const haystack = `${session.title} ${session.studio} ${session.neighborhood}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    })
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const grouped = filtered.reduce((acc, session) => {
    const key = formatEasternHeaderDate(session.startDate);
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(session);
    return acc;
  }, new Map());

  return (
    <main className="tds-calendar-page">
      <AppNav member={member} />
      <PageHeader />
      <section className="tds-calendar-tools">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search classes, studios, neighborhoods"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </section>
      <section className="tds-calendar-list">
        {Array.from(grouped.entries()).map(([date, items]) => (
          <div className="tds-calendar-day" key={date}>
            <div className="tds-calendar-day-head">
              <h2>{date}</h2>
              <span>{items.length} classes</span>
            </div>
            <div className="tds-calendar-grid">
              {items.map((session) => (
                <article className="tds-calendar-card" key={session.id}>
                  {session.photo ? <img src={session.photo} alt="" /> : null}
                  <div>
                    <span>{formatEasternTime(session.startDate)}</span>
                    <h3>{session.title}</h3>
                    <p>{session.studio}</p>
                    <small>{session.category}{session.neighborhood ? ` · ${session.neighborhood}` : ""}</small>
                  </div>
                  <button type="button" onClick={() => setSelectedSession(session)}>
                    Details
                  </button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
      {selectedSession ? (
        <div className="tds-modal-backdrop" onClick={() => setSelectedSession(null)}>
          <div className="tds-modal" onClick={(event) => event.stopPropagation()}>
            <div className="tds-modal-header">
              <div>
                <span>{formatEasternTime(selectedSession.startDate)}</span>
                <h3>{selectedSession.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedSession(null)} aria-label="Close details">
                ×
              </button>
            </div>
            <div className="tds-modal-body">
              {selectedSession.photo ? <img src={selectedSession.photo} alt="" /> : null}
              <div>
                <span>{selectedSession.category}</span>
                <p>{selectedSession.studio}</p>
                <p>{selectedSession.neighborhood}</p>
                {selectedSession.description ? <p>{selectedSession.description}</p> : null}
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
              Showing {visibleItems.length}{" "}
              {visibleItems.length === 1 ? "class" : "classes"}
              {activeFilter !== "all" ? ` in ${activeFilter}` : ""}
              {hasMoreToShow ? " - load more below." : ""}
            </p>
          </div>
        </div>

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
  const [now, setNow] = useState(() => floorToMinute(new Date()));
  const [sessions, setSessions] = useState(fallbackSessions);
  const [dataStatus, setDataStatus] = useState({
    source: "sample",
    count: fallbackSessions.length,
    error: ""
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
    };

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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
          error: ""
        });
      })
      .catch((error) => {
        if (isMounted) setSessions(fallbackSessions);
        if (isMounted) {
          setDataStatus({
            source: "sample",
            count: fallbackSessions.length,
            error: error instanceof Error ? error.message : "Airtable unavailable"
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
    return <LoginPage onMemberChange={setMember} />;
  }

  if (path === "/signup") {
    return <SignupPage />;
  }

  if (path === "/profile") {
    return <ProfilePage member={member} onMemberChange={setMember} />;
  }

  if (path === "/calendar") {
    return <CalendarPage member={member} activeSessions={activeSessions} />;
  }

  return (
    <main className="tds-page">
      <AppNav member={member} />
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
