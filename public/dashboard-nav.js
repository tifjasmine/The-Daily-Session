(function () {
  const DASHBOARD_PATHS = new Set([
    "/profile",
    "/calendar",
    "/saved-classes",
    "/companies",
    "/wellness-providers"
  ]);

  const DASHBOARD_ITEMS = [
    ["Dashboard", "/profile"],
    ["Saved Classes", "/saved-classes"],
    ["Full Calendar", "/calendar"],
    ["Providers", "/wellness-providers"],
    ["Studios", "/companies"]
  ];

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const textOf = (element) => (element.textContent || "").replace(/\s+/g, " ").trim();

  const isDashboardPath = (path) =>
    DASHBOARD_PATHS.has(path) ||
    path.startsWith("/companies/") ||
    path.startsWith("/wellness-providers/");

  const closeDashboard = (nav) => {
    const menu = nav.querySelector("[data-dashboard-menu]");
    const trigger = nav.querySelector("[data-dashboard-trigger]");
    if (menu) menu.remove();
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  };

  const enhanceNav = () => {
    const nav = document.querySelector(".tds-nav");
    const navLinks = nav?.querySelector(":scope > div");
    if (!nav || !navLinks || navLinks.dataset.dashboardEnhanced === "true") return;

    const buttons = Array.from(navLinks.querySelectorAll(":scope > button, :scope > .tds-nav-menu > button"));
    const hasLogout = buttons.some((button) => textOf(button) === "Log Out");
    if (!hasLogout) return;

    navLinks.querySelectorAll("[data-dashboard-nav]").forEach((element) => element.remove());
    navLinks.dataset.dashboardEnhanced = "true";

    Array.from(navLinks.children).forEach((child) => {
      const childText = textOf(child);
      if (child.matches("button") && (childText === "Calendar" || childText === "Profile")) child.remove();
      if (child.matches(".tds-nav-menu") && (childText.startsWith("Explore") || childText.startsWith("Dashboard"))) {
        child.remove();
      }
    });

    const logoutButton = Array.from(navLinks.querySelectorAll(":scope > button")).find(
      (button) => textOf(button) === "Log Out"
    );

    const wrapper = document.createElement("div");
    wrapper.className = "tds-nav-menu";
    wrapper.dataset.dashboardNav = "true";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.dataset.dashboardTrigger = "true";
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    if (isDashboardPath(window.location.pathname)) trigger.className = "is-active";
    trigger.innerHTML = 'Dashboard <span aria-hidden="true">⌄</span>';

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const existing = wrapper.querySelector("[data-dashboard-menu]");
      if (existing) {
        closeDashboard(wrapper);
        return;
      }

      const menu = document.createElement("div");
      menu.className = "tds-nav-dropdown";
      menu.dataset.dashboardMenu = "true";
      menu.setAttribute("role", "menu");

      DASHBOARD_ITEMS.forEach(([label, path]) => {
        const item = document.createElement("button");
        item.type = "button";
        item.setAttribute("role", "menuitem");
        item.textContent = label;
        if (window.location.pathname === path) item.className = "is-active";
        item.addEventListener("click", () => {
          closeDashboard(wrapper);
          navigate(path);
        });
        menu.appendChild(item);
      });

      wrapper.appendChild(menu);
      trigger.setAttribute("aria-expanded", "true");
    });

    wrapper.appendChild(trigger);
    navLinks.insertBefore(wrapper, logoutButton || null);
  };

  let scheduled = false;
  let retryTimer = null;

  const runSoon = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      enhanceNav();
    });
  };

  const retryEnhance = () => {
    let attempts = 0;
    window.clearInterval(retryTimer);
    retryTimer = window.setInterval(() => {
      attempts += 1;
      runSoon();

      if (document.querySelector(".tds-nav [data-dashboard-nav]") || attempts >= 25) {
        window.clearInterval(retryTimer);
      }
    }, 80);
  };

  window.addEventListener("popstate", () => {
    document.querySelectorAll(".tds-nav [data-dashboard-nav]").forEach((element) => element.remove());
    document.querySelectorAll(".tds-nav [data-dashboard-enhanced]").forEach((element) => {
      delete element.dataset.dashboardEnhanced;
    });
    retryEnhance();
  });

  window.addEventListener("pointerdown", (event) => {
    const nav = document.querySelector(".tds-nav");
    if (nav && !nav.contains(event.target)) closeDashboard(nav);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const nav = document.querySelector(".tds-nav");
      if (nav) closeDashboard(nav);
    }
  });

  retryEnhance();
})();
