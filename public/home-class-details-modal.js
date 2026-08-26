(function () {
  const EASTERN_TZ = "America/New_York";
  let sessionsPromise = null;
  let activeModal = null;

  const text = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const lower = (value) => text(value).toLowerCase();
  const escapeHtml = (value) =>
    text(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  const escapeAttr = escapeHtml;

  const getEasternDateKey = (date) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    return `${parts.find((p) => p.type === "year")?.value || ""}-${parts.find((p) => p.type === "month")?.value || ""}-${parts.find((p) => p.type === "day")?.value || ""}`;
  };

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      timeZone: EASTERN_TZ,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      timeZone: EASTERN_TZ,
      hour: "numeric",
      minute: "2-digit"
    });

  const normalizeList = (value) =>
    text(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const getPhoto = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return getPhoto(value[0]);
    return value?.thumbnails?.large?.url || value?.thumbnails?.full?.url || value?.url || "";
  };

  const normalizeSession = (session) => {
    const startDate = new Date(session.start || session.Start || "");
    return {
      ...session,
      id: session.id || session.recordId || session["Record ID"] || "",
      title: session.title || session.className || session["Class Name"] || session.name || session.Name || "Class Details",
      studio: session.studio || session.studioName || session.Studio || "Studio",
      category: session.category || session.Category || "Class",
      subcategory: session.subcategory || session.Subcategory || "",
      neighborhood: session.neighborhood || session.Neighborhood || "",
      address: session.address || session.Address || "",
      level: session.level || session.Level || "",
      dropInRate: session.dropInRate || session.rate || session["Drop in Rate"] || "",
      priceBracket: session.priceBracket || session["Price Bracket"] || "",
      description: session.description || session.Description || "",
      reminder: session.reminder || session.Reminder || "",
      googleCalendarLink: session.googleCalendarLink || session["Google Calendar Link"] || "",
      signUpLink: session.signUpLink || session.studioSite || session.bookingLink || session["Sign Up Link"] || "",
      photo: getPhoto(session.photo || session.Photo),
      tags: session.tags || session.Tags || "",
      moodMatcher: session.moodMatcher || session["Mood Matcher"] || "",
      energyLevel: session.energyLevel || session["Energy Level"] || "",
      outcomeBenefit: session.outcomeBenefit || session["Outcome/Benefit"] || "",
      start: session.start || session.Start || "",
      startDate
    };
  };

  const getSessions = () => {
    if (!sessionsPromise) {
      sessionsPromise = fetch("/api/sessions")
        .then((response) => {
          if (!response.ok) throw new Error("Unable to load class details.");
          return response.json();
        })
        .then((payload) => (Array.isArray(payload.sessions) ? payload.sessions : []).map(normalizeSession));
    }
    return sessionsPromise;
  };

  const getPrice = (session) => {
    const rateText = text(session.dropInRate);
    if (rateText) {
      const cleaned = rateText.replace(/[^0-9.]/g, "");
      const amount = Number(cleaned);
      if (!Number.isNaN(amount) && cleaned) return amount === 0 ? "Free" : `$${amount.toFixed(0)}`;
      return rateText;
    }
    return text(session.priceBracket);
  };

  const getTags = (session) => [
    ...normalizeList(session.subcategory),
    ...normalizeList(session.tags),
    ...normalizeList(session.moodMatcher),
    ...normalizeList(session.energyLevel),
    ...normalizeList(session.outcomeBenefit)
  ];

  const getMember = () => {
    try {
      return JSON.parse(window.localStorage.getItem("tdsMember") || "null");
    } catch {
      return null;
    }
  };

  const getAuthSession = () => {
    try {
      return JSON.parse(window.localStorage.getItem("tdsSupabaseSession") || "null");
    } catch {
      return null;
    }
  };

  const getEmail = () => text(getMember()?.email || getAuthSession()?.user?.email).toLowerCase();

  const findSession = async (card) => {
    const title = lower(card.querySelector("h3")?.textContent);
    const studio = lower(card.querySelector(".tds-session-main p")?.textContent);
    const category = lower(card.querySelector(".tds-session-meta span")?.textContent);
    const time = text(card.closest(".tds-session-group")?.querySelector(".tds-time-row span")?.textContent);
    const today = getEasternDateKey(new Date());
    const sessions = await getSessions();
    const candidates = sessions.filter((session) => {
      if (!session.startDate || Number.isNaN(session.startDate.getTime())) return false;
      return getEasternDateKey(session.startDate) === today && formatTime(session.startDate) === time;
    });
    return (
      candidates.find((session) => lower(session.title) === title && lower(session.studio) === studio) ||
      candidates.find((session) => lower(session.title) === title) ||
      sessions.find((session) => lower(session.title) === title && lower(session.studio) === studio && lower(session.category) === category) ||
      null
    );
  };

  const saveClass = async (session, modal) => {
    const email = getEmail();
    const message = modal.querySelector("[data-class-message]");
    if (!email) {
      message.textContent = "Log in to save classes.";
      return;
    }
    message.textContent = "Saving...";
    const member = getMember();
    const authSession = getAuthSession();
    try {
      const response = await fetch("/api/saved-classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          memberName: member?.name || authSession?.user?.user_metadata?.name || email,
          session: {
            ...session,
            start: session.start || session.startDate?.toISOString?.() || "",
            startIso: session.startDate?.toISOString?.() || session.start || ""
          }
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || payload.error || "Could not save class.");
      message.textContent = payload.alreadySaved ? "Already saved." : "Saved to your classes.";
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : "Could not save class.";
      message.classList.add("is-error");
    }
  };

  const stat = (label, value) =>
    value ? `<div class="tds-live-class-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>` : "";

  const renderModal = (session) => {
    closeModal();
    const tags = getTags(session);
    const price = getPrice(session);
    const canSave = Boolean(getEmail());
    const wrapper = document.createElement("div");
    wrapper.className = "tds-live-modal-backdrop";
    wrapper.innerHTML = `
      <section class="tds-live-class-modal" role="dialog" aria-modal="true" aria-labelledby="tds-live-class-title">
        <header>
          <div>
            <span>${escapeHtml(formatTime(session.startDate))}</span>
            <h2 id="tds-live-class-title">${escapeHtml(session.title)}</h2>
          </div>
          <button type="button" data-close-modal aria-label="Close details">×</button>
        </header>
        <div class="tds-live-class-body">
          <div class="tds-live-class-media">
            ${
              session.photo
                ? `<img src="${escapeAttr(session.photo)}" alt="" />`
                : `<div class="tds-live-class-placeholder" aria-hidden="true"></div>`
            }
          </div>
          <div class="tds-live-class-detail">
            <div class="tds-live-class-title-row">
              <span>${escapeHtml(session.category)}</span>
              <p>${escapeHtml(session.studio)}</p>
            </div>
            <div class="tds-live-class-stats">
              ${stat("Date and Time", `${formatDate(session.startDate)} · ${formatTime(session.startDate)}`)}
              ${stat("Price", price)}
              ${stat("Location", session.address || session.neighborhood)}
              ${stat("Level", session.level)}
            </div>
            ${
              tags.length
                ? `<div class="tds-live-class-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
                : ""
            }
            <section class="tds-live-class-about">
              <h3>About This Class</h3>
              <p>${escapeHtml(session.description || "Details are still being gathered for this class. Check the studio signup page for the most current notes.")}</p>
            </section>
            ${
              session.reminder
                ? `<aside class="tds-live-class-reminder"><strong>Good to know</strong><p>${escapeHtml(session.reminder)}</p></aside>`
                : ""
            }
            <div class="tds-live-class-actions">
              ${
                session.signUpLink
                  ? `<a href="${escapeAttr(session.signUpLink)}" target="_blank" rel="noreferrer">Sign Up for This Class</a>`
                  : ""
              }
              ${
                session.googleCalendarLink
                  ? `<a href="${escapeAttr(session.googleCalendarLink)}" target="_blank" rel="noreferrer">Add to Google Calendar</a>`
                  : ""
              }
              ${canSave ? `<button type="button" data-save-class>Save Class</button>` : ""}
              <small data-class-message></small>
            </div>
          </div>
        </div>
      </section>
    `;
    wrapper.addEventListener("click", (event) => {
      if (event.target === wrapper || event.target.closest("[data-close-modal]")) closeModal();
      if (event.target.closest("[data-save-class]")) saveClass(session, wrapper);
    });
    document.body.appendChild(wrapper);
    document.body.dataset.tdsModalOpen = "true";
    activeModal = wrapper;
  };

  const closeModal = () => {
    activeModal?.remove();
    activeModal = null;
    delete document.body.dataset.tdsModalOpen;
  };

  const injectStyles = () => {
    if (document.getElementById("tds-live-class-modal-style")) return;
    const style = document.createElement("style");
    style.id = "tds-live-class-modal-style";
    style.textContent = `
      body[data-tds-modal-open="true"] { overflow: hidden; }
      .tds-live-modal-backdrop { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(34,20,12,.72); padding: 24px; }
      .tds-live-class-modal { width: min(920px, 100%); max-height: 88vh; overflow: hidden; border: 1px solid #d8c4b2; border-radius: 8px; background: #f8f4ef; box-shadow: 0 24px 80px rgba(34,20,12,.36); }
      .tds-live-class-modal header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; border-bottom: 1px solid #ddc7b5; background: #f3e8dd; padding: 20px 24px; }
      .tds-live-class-modal header span { color: #8e6c58; font-size: .9rem; font-weight: 750; }
      .tds-live-class-modal h2 { margin: 4px 0 0; color: #3d2314; font-family: var(--tds-serif, Georgia, serif); font-size: clamp(1.45rem, 3vw, 2rem); font-weight: 600; line-height: 1.08; }
      .tds-live-class-modal header button { width: 40px; height: 40px; flex: 0 0 auto; border: 1px solid #9d7c67; border-radius: 999px; background: #fff9f3; color: #5a2b0c; cursor: pointer; font-size: 1.2rem; font-weight: 800; }
      .tds-live-class-body { display: grid; grid-template-columns: minmax(220px, 300px) 1fr; gap: 24px; max-height: calc(88vh - 104px); overflow: auto; padding: 24px; }
      .tds-live-class-media img, .tds-live-class-placeholder { width: 100%; aspect-ratio: 4 / 3; border-radius: 8px; object-fit: cover; background: #3d2314; }
      .tds-live-class-title-row { display: grid; gap: 6px; margin-bottom: 16px; }
      .tds-live-class-title-row > span { display: inline-flex; width: fit-content; border-radius: 999px; background: #f1e2d2; color: #7a4a2a; padding: 6px 10px; font-size: .75rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
      .tds-live-class-title-row p { margin: 0; color: #6b4a2f; font-size: 1rem; font-weight: 750; }
      .tds-live-class-stats { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; margin-bottom: 18px; }
      .tds-live-class-stat { border-radius: 8px; background: #f3e8dd; padding: 12px; }
      .tds-live-class-stat span { display: block; margin-bottom: 4px; color: #9a7060; font-size: .68rem; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
      .tds-live-class-stat strong { color: #3d2314; font-size: .9rem; line-height: 1.35; }
      .tds-live-class-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 20px; }
      .tds-live-class-tags span { border: 1px solid rgba(61,35,20,.12); border-radius: 999px; background: rgba(61,35,20,.06); color: #6b4a2f; padding: 5px 10px; font-size: .76rem; font-weight: 750; }
      .tds-live-class-about { border-top: 1px solid rgba(61,35,20,.1); padding-top: 18px; }
      .tds-live-class-about h3 { margin: 0 0 8px; color: #3d2314; font-family: var(--tds-serif, Georgia, serif); font-size: 1.45rem; font-weight: 650; }
      .tds-live-class-about p, .tds-live-class-reminder p { margin: 0; color: #6b4a2f; font-size: .98rem; line-height: 1.7; white-space: pre-line; }
      .tds-live-class-reminder { margin-top: 18px; border: 1px solid rgba(196,87,42,.2); border-radius: 8px; background: rgba(196,87,42,.07); padding: 12px; }
      .tds-live-class-reminder strong { display: block; margin-bottom: 5px; color: #c4572a; font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; }
      .tds-live-class-reminder p { color: #9a4d2c; }
      .tds-live-class-actions { display: grid; gap: 10px; margin-top: 20px; }
      .tds-live-class-actions a, .tds-live-class-actions button { min-height: 42px; border: 0; border-radius: 8px; background: #5a2b0c; color: #fff; padding: 10px 16px; text-align: center; text-decoration: none; font-size: .9rem; font-weight: 750; cursor: pointer; }
      .tds-live-class-actions a:nth-of-type(2) { border: 1px solid rgba(61,35,20,.15); background: rgba(61,35,20,.06); color: #3d2314; }
      .tds-live-class-actions small { min-height: 18px; color: #6b4a2f; font-size: .85rem; }
      .tds-live-class-actions small.is-error { color: #c42e1f; }
      @media (max-width: 760px) { .tds-live-modal-backdrop { padding: 12px; } .tds-live-class-modal header { padding: 16px; } .tds-live-class-body { grid-template-columns: 1fr; gap: 16px; padding: 16px; } .tds-live-class-stats { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  };

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || text(button.textContent) !== "Details") return;
    const card = button.closest(".tds-session-card");
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    injectStyles();
    button.disabled = true;
    const original = button.textContent;
    button.textContent = "Loading...";
    try {
      const session = await findSession(card);
      if (session) renderModal(session);
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }, true);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
})();