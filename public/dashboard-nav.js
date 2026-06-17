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

  const textOf = (element) => (element?.textContent || "").replace(/\s+/g, " ").trim();

  const isDashboardPath = (path) =>
    DASHBOARD_PATHS.has(path) ||
    path.startsWith("/companies/") ||
    path.startsWith("/wellness-providers/");

  const isActivePath = (path) =>
    path === "/" ? window.location.pathname === "/" : window.location.pathname === path || window.location.pathname.startsWith(`${path}/`);

  const directChildren = (element) => Array.from(element?.children || []);

  const topButton = (navLinks, label) =>
    directChildren(navLinks).find((child) => child.matches?.("button") && textOf(child) === label);

  const menuByTrigger = (navLinks, label) =>
    directChildren(navLinks).find((child) => {
      if (!child.matches?.(".tds-nav-menu")) return false;
      const button = child.querySelector(":scope > button");
      return textOf(button).startsWith(label);
    });

  const closeCustomDashboard = (root) => {
    const wrapper = root?.matches?.("[data-dashboard-nav]") ? root : root?.querySelector?.("[data-dashboard-nav]");
    const menu = wrapper?.querySelector?.("[data-dashboard-menu]");
    const trigger = wrapper?.querySelector?.("[data-dashboard-trigger]");
    if (menu) menu.remove();
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  };

  const dimOtherOpenMenus = (nav, currentWrapper) => {
    nav.querySelectorAll(".tds-nav-menu").forEach((menu) => {
      if (menu === currentWrapper) return;
      const dropdown = menu.querySelector(":scope > .tds-nav-dropdown");
      const trigger = menu.querySelector(":scope > button");
      if (dropdown) dropdown.style.display = "none";
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  };

  const restoreMenuVisibility = (nav) => {
    nav.querySelectorAll(".tds-nav-dropdown").forEach((dropdown) => {
      dropdown.style.display = "";
    });
  };

  const sanitizeJoinMenu = (navLinks, isLoggedIn) => {
    const joinMenu = menuByTrigger(navLinks, "Join Us");
    if (!joinMenu) return;

    const joinTrigger = joinMenu.querySelector(":scope > button");
    if (!joinTrigger?.dataset.joinNormalized) {
      joinTrigger.dataset.joinNormalized = "true";
      joinTrigger.addEventListener("click", () => {
        closeCustomDashboard(navLinks);
        window.setTimeout(() => sanitizeJoinMenu(navLinks, isLoggedIn), 0);
      });
    }

    if (!isLoggedIn) return;
    joinMenu.querySelectorAll(":scope > .tds-nav-dropdown > button").forEach((button) => {
      if (textOf(button) === "Student") button.remove();
    });
  };

  const ensureFullCalendarForLoggedOut = (navLinks) => {
    const loginButton = topButton(navLinks, "Log In");
    const existingCalendar = topButton(navLinks, "Calendar") || topButton(navLinks, "Full Calendar");

    if (existingCalendar) {
      existingCalendar.textContent = "Full Calendar";
      existingCalendar.onclick = () => navigate("/calendar");
      existingCalendar.className = isActivePath("/calendar") ? "is-active" : "";
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Full Calendar";
      button.className = isActivePath("/calendar") ? "is-active" : "";
      button.addEventListener("click", () => navigate("/calendar"));
      navLinks.insertBefore(button, loginButton || null);
    }

    if (loginButton) loginButton.remove();
  };

  const ensureAccountForLoggedIn = (navLinks, logoutButton) => {
    if (topButton(navLinks, "Account")) return;

    const accountButton = document.createElement("button");
    accountButton.type = "button";
    accountButton.textContent = "Account";
    accountButton.className = isActivePath("/profile") ? "is-active" : "";
    accountButton.addEventListener("click", () => navigate("/profile"));
    navLinks.insertBefore(accountButton, logoutButton || null);
  };

  const removeLoggedInExtras = (navLinks) => {
    directChildren(navLinks).forEach((child) => {
      const childText = textOf(child);
      if (child.matches?.("button") && ["Calendar", "Full Calendar", "Profile", "Log In"].includes(childText)) child.remove();
      if (child.matches?.(".tds-nav-menu") && childText.startsWith("Explore")) child.remove();
    });
  };

  const ensureDashboardForLoggedIn = (nav, navLinks, logoutButton) => {
    const existingDashboard = menuByTrigger(navLinks, "Dashboard");
    if (existingDashboard && !existingDashboard.dataset.dashboardNav) return;

    navLinks.querySelectorAll("[data-dashboard-nav]").forEach((element) => element.remove());

    const wrapper = document.createElement("div");
    wrapper.className = "tds-nav-menu";
    wrapper.dataset.dashboardNav = "true";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.dataset.dashboardTrigger = "true";
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    if (isDashboardPath(window.location.pathname)) trigger.className = "is-active";
    trigger.innerHTML = 'Dashboard <span aria-hidden="true">v</span>';

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      restoreMenuVisibility(nav);
      const existing = wrapper.querySelector("[data-dashboard-menu]");
      if (existing) {
        closeCustomDashboard(wrapper);
        return;
      }

      dimOtherOpenMenus(nav, wrapper);
      const menu = document.createElement("div");
      menu.className = "tds-nav-dropdown";
      menu.dataset.dashboardMenu = "true";
      menu.setAttribute("role", "menu");

      DASHBOARD_ITEMS.forEach(([label, path]) => {
        const item = document.createElement("button");
        item.type = "button";
        item.setAttribute("role", "menuitem");
        item.textContent = label;
        if (isActivePath(path)) item.className = "is-active";
        item.addEventListener("click", () => {
          closeCustomDashboard(wrapper);
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

  const normalizeNav = () => {
    const nav = document.querySelector(".tds-nav");
    const navLinks = nav?.querySelector(":scope > div");
    if (!nav || !navLinks) return;

    const buttons = Array.from(navLinks.querySelectorAll(":scope > button, :scope > .tds-nav-menu > button"));
    const isLoggedIn = buttons.some((button) => textOf(button) === "Log Out");
    const logoutButton = topButton(navLinks, "Log Out");

    sanitizeJoinMenu(navLinks, isLoggedIn);

    if (isLoggedIn) {
      removeLoggedInExtras(navLinks);
      ensureDashboardForLoggedIn(nav, navLinks, logoutButton);
      ensureAccountForLoggedIn(navLinks, logoutButton);
    } else {
      navLinks.querySelectorAll("[data-dashboard-nav]").forEach((element) => element.remove());
      directChildren(navLinks).forEach((child) => {
        const childText = textOf(child);
        if (child.matches?.(".tds-nav-menu") && (childText.startsWith("Explore") || childText.startsWith("Dashboard"))) child.remove();
        if (child.matches?.("button") && childText === "Profile") child.remove();
      });
      ensureFullCalendarForLoggedOut(navLinks);
    }
  };

  let retryTimer = null;

  const retryNormalize = () => {
    let attempts = 0;
    window.clearInterval(retryTimer);
    retryTimer = window.setInterval(() => {
      attempts += 1;
      normalizeNav();
      if (document.querySelector(".tds-nav") || attempts >= 25) window.clearInterval(retryTimer);
    }, 80);
  };

  window.addEventListener("popstate", retryNormalize);

  window.addEventListener("pointerdown", (event) => {
    const nav = document.querySelector(".tds-nav");
    if (!nav) return;
    if (!nav.contains(event.target)) {
      restoreMenuVisibility(nav);
      closeCustomDashboard(nav);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const nav = document.querySelector(".tds-nav");
    if (!nav) return;
    restoreMenuVisibility(nav);
    closeCustomDashboard(nav);
  });

  retryNormalize();
})();
