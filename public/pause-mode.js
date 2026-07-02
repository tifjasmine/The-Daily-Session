(function () {
  const LOCKED_PATHS = new Set(["/login", "/signup", "/create-account"]);

  const copy = {
    login: {
      eyebrow: "Member access update",
      title: "Please hold while we make The Daily Session even better.",
      body: "Already a member or beta user? Drop your email below. Because of the delay, we promise to add an additional YEAR of free access when the full member site reopens.",
      button: "Save my extra year",
      success: "You are on the list. We will match this email to your member access when the full site reopens."
    },
    signup: {
      eyebrow: "Big things loading",
      title: "Membership is getting a glow-up.",
      body: "The full site is being updated behind the scenes. Drop your email and we will let you know the moment memberships reopen.",
      button: "Keep me posted",
      success: "You are on the update list. We will send the good news when everything is ready."
    }
  };

  const textOf = (element) => (element?.textContent || "").replace(/\s+/g, " ").trim();

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const injectStyles = () => {
    if (document.getElementById("tds-pause-mode-style")) return;
    const style = document.createElement("style");
    style.id = "tds-pause-mode-style";
    style.textContent = `
      .tds-pause-hidden { display: none !important; }
      .tds-pause-nav-actions { display: flex; align-items: center; gap: 12px; }
      .tds-pause-nav-actions button { border: 1px solid rgba(245,232,216,.28); border-radius: 999px; background: transparent; color: #f5e8d8; min-height: 42px; padding: 10px 18px; font: 700 0.92rem var(--tds-sans, inherit); cursor: pointer; }
      .tds-pause-nav-actions button:last-child { background: #f2b36d; border-color: #f2b36d; color: #3d2314; }
      .tds-pause-page { min-height: 100vh; background: radial-gradient(circle at 16% 10%, rgba(242,179,109,.18), transparent 30%), #3d2314; color: #fff7ef; font-family: var(--tds-sans, inherit); }
      .tds-pause-topbar { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 24px clamp(20px, 5vw, 72px); border-bottom: 1px solid rgba(245,232,216,.14); }
      .tds-pause-brand { border: 0; background: transparent; color: #fff7ef; font: 800 1.05rem var(--tds-serif, serif); cursor: pointer; }
      .tds-pause-shell { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(320px, .75fr); gap: clamp(28px, 5vw, 76px); align-items: center; padding: clamp(58px, 8vw, 118px) clamp(22px, 7vw, 110px); }
      .tds-pause-copy span { display: inline-flex; align-items: center; gap: 12px; color: #f2b36d; text-transform: uppercase; letter-spacing: .14em; font-size: .78rem; font-weight: 800; }
      .tds-pause-copy span::before { content: ''; width: 54px; height: 2px; background: #c4572a; }
      .tds-pause-copy h1 { max-width: 780px; margin: 24px 0 22px; font-family: var(--tds-serif, serif); font-size: clamp(2.35rem, 5vw, 4.3rem); line-height: 1.04; letter-spacing: 0; }
      .tds-pause-copy p { max-width: 720px; margin: 0; color: rgba(255,247,239,.74); font-size: clamp(1rem, 1.6vw, 1.24rem); line-height: 1.75; }
      .tds-pause-card { background: #fff8ef; color: #3d2314; border-radius: 8px; padding: clamp(24px, 4vw, 42px); box-shadow: 0 24px 80px rgba(0,0,0,.28); }
      .tds-pause-card h2 { margin: 0 0 10px; font-family: var(--tds-serif, serif); font-size: 2rem; }
      .tds-pause-card p { margin: 0 0 22px; color: #8a6654; line-height: 1.55; }
      .tds-pause-card label { display: grid; gap: 8px; margin-bottom: 14px; color: #6f4c39; font-size: .9rem; font-weight: 800; }
      .tds-pause-card input { min-height: 48px; border: 1px solid #decfc1; border-radius: 8px; background: #fffdf9; color: #3d2314; padding: 12px 14px; font: inherit; }
      .tds-pause-card button { width: 100%; min-height: 50px; border: 0; border-radius: 8px; background: #3d2314; color: #fff7ef; font-weight: 850; cursor: pointer; }
      .tds-pause-message { min-height: 22px; margin-top: 14px !important; font-weight: 750; }
      @media (max-width: 760px) {
        .tds-pause-topbar { align-items: flex-start; flex-direction: column; }
        .tds-pause-nav-actions { width: 100%; }
        .tds-pause-nav-actions button { flex: 1; padding-inline: 12px; }
        .tds-pause-shell { grid-template-columns: 1fr; padding-top: 44px; }
        .tds-pause-copy h1 { font-size: clamp(2.15rem, 10vw, 3.25rem); }
      }
    `;
    document.head.appendChild(style);
  };

  const hideInstallButtons = () => {
    document.querySelectorAll("button, a").forEach((element) => {
      if (/download app|install app|add to home screen/i.test(textOf(element))) element.classList.add("tds-pause-hidden");
    });
    document.querySelectorAll(".tds-pwa-install, .tds-install-app, [data-pwa-install]").forEach((element) => element.classList.add("tds-pause-hidden"));
  };

  const normalizeNav = () => {
    const nav = document.querySelector(".tds-nav");
    const navLinks = nav?.querySelector(":scope > div");
    if (!nav || !navLinks || navLinks.dataset.pauseMode === "true") return;

    navLinks.dataset.pauseMode = "true";
    navLinks.innerHTML = "";
    const actions = document.createElement("div");
    actions.className = "tds-pause-nav-actions";

    const login = document.createElement("button");
    login.type = "button";
    login.textContent = "Login";
    login.addEventListener("click", () => navigate("/login"));

    const member = document.createElement("button");
    member.type = "button";
    member.textContent = "Become a Member";
    member.addEventListener("click", () => navigate("/signup"));

    actions.append(login, member);
    navLinks.appendChild(actions);
  };

  const submitVisitor = async (form, variant) => {
    const message = form.querySelector(".tds-pause-message");
    message.textContent = "Saving your spot...";

    const payload = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      source: variant
    };

    try {
      const response = await fetch("/api/visitors-locked", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || result.error || "Could not save your email yet.");
      message.textContent = copy[variant].success;
      form.reset();
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : "Could not save your email yet.";
    }
  };

  const renderPausePage = () => {
    const path = window.location.pathname;
    if (!LOCKED_PATHS.has(path)) return false;

    const variant = path === "/login" ? "login" : "signup";
    const data = copy[variant];
    const root = document.getElementById("root");
    if (!root || root.dataset.pausePage === variant) return true;

    root.dataset.pausePage = variant;
    root.innerHTML = `
      <main class="tds-pause-page">
        <header class="tds-pause-topbar">
          <button class="tds-pause-brand" type="button">The Daily Session</button>
          <div class="tds-pause-nav-actions">
            <button type="button" data-pause-login>Login</button>
            <button type="button" data-pause-member>Become a Member</button>
          </div>
        </header>
        <section class="tds-pause-shell">
          <div class="tds-pause-copy">
            <span>${data.eyebrow}</span>
            <h1>${data.title}</h1>
            <p>${data.body}</p>
          </div>
          <form class="tds-pause-card">
            <h2>Save my spot</h2>
            <p>Leave your email here and we will make sure you are first to know what is opening next.</p>
            <label>Name<input name="name" placeholder="Your name" /></label>
            <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label>
            <button type="submit">${data.button}</button>
            <p class="tds-pause-message" aria-live="polite"></p>
          </form>
        </section>
      </main>
    `;

    root.querySelector(".tds-pause-brand")?.addEventListener("click", () => navigate("/"));
    root.querySelector("[data-pause-login]")?.addEventListener("click", () => navigate("/login"));
    root.querySelector("[data-pause-member]")?.addEventListener("click", () => navigate("/signup"));
    root.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      submitVisitor(event.currentTarget, variant);
    });

    return true;
  };

  const run = () => {
    injectStyles();
    if (!renderPausePage()) {
      document.getElementById("root")?.removeAttribute("data-pause-page");
      normalizeNav();
      hideInstallButtons();
    }
  };

  window.addEventListener("popstate", () => window.setTimeout(run, 80));
  window.setInterval(() => {
    if (!LOCKED_PATHS.has(window.location.pathname)) {
      normalizeNav();
      hideInstallButtons();
    }
  }, 800);
  window.setTimeout(run, 120);
})();
