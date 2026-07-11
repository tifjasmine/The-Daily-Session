(function () {
  const PASSWORD = "Password123";
  const ALLOWED_EMAILS = new Set(["tiffjasmine92@gmail.com", "yourdailysession@gmail.com"]);

  const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
  const isAllowedEmail = (email) => ALLOWED_EMAILS.has(normalizeEmail(email));

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const render = () => {
    if (window.location.pathname !== "/login") return;
    const root = document.getElementById("root");
    if (!root || root.dataset.betaLoginPage === "true") return;

    root.dataset.betaLoginPage = "true";
    root.dataset.pausePage = "";
    root.innerHTML = `
      <main class="tds-pause-page tds-beta-login-page">
        <header class="tds-pause-topbar">
          <button class="tds-pause-brand" type="button" data-beta-home>The Daily Session</button>
          <div class="tds-pause-nav-actions">
            <button type="button" data-beta-home>Home</button>
            <button type="button" data-beta-member>Become a Member</button>
          </div>
        </header>
        <section class="tds-pause-shell">
          <div class="tds-pause-copy">
            <span>Beta member access</span>
            <h1>Your private door is ready.</h1>
            <p>Enter your approved email first. If it matches the beta list, the password step will open and you will get full member access while the site updates continue.</p>
          </div>
          <form class="tds-pause-card" data-beta-form>
            <h2>Login</h2>
            <p>Use one of the approved beta emails, then enter the shared beta password.</p>
            <label>Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com" /></label>
            <label data-beta-password-wrap hidden>Password<input name="password" type="password" autocomplete="current-password" placeholder="Password123" /></label>
            <button type="submit" data-beta-submit>Continue</button>
            <p class="tds-pause-message" aria-live="polite"></p>
          </form>
        </section>
      </main>
    `;

    root.querySelectorAll("[data-beta-home]").forEach((button) => button.addEventListener("click", () => navigate("/")));
    root.querySelector("[data-beta-member]")?.addEventListener("click", () => navigate("/signup"));

    const form = root.querySelector("[data-beta-form]");
    const emailInput = form?.elements.email;
    const passwordWrap = root.querySelector("[data-beta-password-wrap]");
    const passwordInput = form?.elements.password;
    const submit = root.querySelector("[data-beta-submit]");
    const message = root.querySelector(".tds-pause-message");

    const showPasswordIfAllowed = () => {
      const allowed = isAllowedEmail(emailInput.value);
      passwordWrap.hidden = !allowed;
      passwordInput.required = allowed;
      submit.textContent = allowed ? "Unlock full access" : "Continue";
      message.textContent = allowed ? "Approved email found. Enter the beta password to continue." : "";
      if (allowed) passwordInput.focus();
    };

    emailInput?.addEventListener("change", showPasswordIfAllowed);
    emailInput?.addEventListener("input", () => {
      if (isAllowedEmail(emailInput.value)) showPasswordIfAllowed();
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = normalizeEmail(emailInput.value);
      if (!isAllowedEmail(email)) {
        message.textContent = "This beta login is only open for approved emails right now.";
        return;
      }

      if (passwordInput.value !== PASSWORD) {
        message.textContent = "That password did not match. Try Password123.";
        passwordInput.focus();
        return;
      }

      if (!window.tdsBetaAccess?.activate?.(email)) {
        message.textContent = "The beta access helper did not load yet. Refresh and try again.";
        return;
      }

      message.textContent = "You are in. Opening the member calendar...";
      window.setTimeout(() => navigate("/calendar"), 250);
    });
  };

  window.addEventListener("popstate", () => {
    document.getElementById("root")?.removeAttribute("data-beta-login-page");
    window.setTimeout(render, 140);
  });

  window.setTimeout(render, 180);
  window.setTimeout(render, 500);
})();
