(function () {
  const polish = () => {
    document.querySelectorAll(".tds-nav .tds-nav-logo").forEach((logo) => {
      logo.innerHTML = "The Daily Session";
      logo.dataset.pauseLogoPolished = "true";
    });
  };

  const inject = () => {
    if (!document.getElementById("tds-pause-polish-style")) {
      const style = document.createElement("style");
      style.id = "tds-pause-polish-style";
      style.textContent = `
        .tds-nav {
          min-height: 76px !important;
          padding: 16px clamp(20px, 5vw, 72px) !important;
          background: #3d2314 !important;
          border-bottom: 1px solid rgba(245, 232, 216, 0.14) !important;
        }

        .tds-nav .tds-nav-logo {
          display: inline-flex !important;
          align-items: center !important;
          min-height: 42px !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: #fff7ef !important;
          padding: 0 !important;
          font-family: var(--tds-serif, Georgia, serif) !important;
          font-size: clamp(1.25rem, 2vw, 1.55rem) !important;
          font-weight: 850 !important;
          line-height: 1 !important;
          letter-spacing: 0 !important;
          opacity: 1 !important;
          text-shadow: none !important;
          filter: none !important;
        }

        .tds-nav .tds-nav-logo::before,
        .tds-nav .tds-nav-logo::after,
        .tds-mini-logo-icon,
        .tds-mini-logo-text {
          display: none !important;
          content: none !important;
        }

        .tds-pause-nav-actions {
          display: inline-flex !important;
          align-items: center !important;
          gap: 10px !important;
        }

        .tds-pause-nav-actions button {
          min-height: 40px !important;
          border-radius: 999px !important;
          border: 1px solid rgba(245, 232, 216, .28) !important;
          background: transparent !important;
          color: #f5e8d8 !important;
          padding: 9px 17px !important;
          font: 750 .9rem var(--tds-sans, inherit) !important;
          letter-spacing: 0 !important;
          box-shadow: none !important;
        }

        .tds-pause-nav-actions button:last-child {
          border-color: #d9602d !important;
          background: #d9602d !important;
          color: #fff7ef !important;
          padding-inline: 19px !important;
        }

        .tds-brand-lockup,
        .tds-brand-lockup * {
          opacity: 1 !important;
          filter: none !important;
        }

        .tds-brand-lockup {
          color: #fff7ef !important;
        }

        .tds-brand-lockup svg,
        .tds-brand-lockup img {
          opacity: 1 !important;
          filter: none !important;
        }

        .tds-pause-topbar .tds-pause-brand {
          color: #fff7ef !important;
          opacity: 1 !important;
          filter: none !important;
        }

        @media (max-width: 760px) {
          .tds-nav {
            gap: 12px !important;
          }

          .tds-pause-nav-actions {
            width: 100% !important;
          }

          .tds-pause-nav-actions button {
            flex: 1 1 0 !important;
            padding-inline: 10px !important;
            font-size: .88rem !important;
            white-space: nowrap !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    polish();
  };

  window.setTimeout(inject, 0);
  window.setTimeout(inject, 300);
  window.setInterval(polish, 800);
  window.addEventListener("popstate", () => window.setTimeout(inject, 80));
})();
