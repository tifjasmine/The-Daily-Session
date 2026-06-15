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
  startDate: new Date(session.start)
});

const ScheduleSection = ({ now, activeSessions }) => {
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
  const [now, setNow] = useState(() => floorToMinute(new Date()));
  const [sessions, setSessions] = useState(fallbackSessions);
  const [displayToday, setDisplayToday] = useState("0");
  const [displayTomorrow, setDisplayTomorrow] = useState("0");
  const [displayStudios, setDisplayStudios] = useState("0");

  const animationCleanupRef = useRef({
    today: null,
    tomorrow: null,
    studios: null
  });

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
      })
      .catch(() => {
        if (isMounted) setSessions(fallbackSessions);
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

  return (
    <main className="tds-page">
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

      <ScheduleSection now={now} activeSessions={activeSessions} />
    </main>
  );
}
