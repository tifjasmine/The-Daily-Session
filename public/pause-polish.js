(function () {
  const LOGO_SRC = "/pause-header-logo.svg";

  const logoImage = (className) => `
    <img class="${className}" src="${LOGO_SRC}" alt="The Daily Session Philadelphia" decoding="async" />
  `;

  const polish = () => {
    document.querySelectorAll(".tds-nav .tds-nav-logo").forEach((logo) => {
      if (logo.dataset.pauseLogoVersion === "asset-left-cream-v1") return;
      logo.dataset.pauseLogoVersion = "asset-left-cream-v1";
      logo.innerHTML = logoImage("tds-header-logo-img");
    });

    document.querySelectorAll(".tds-pause-brand").forEach((brand) => {
      if (brand.dataset.pauseLogoVersion === "asset-pause-cream-v1") return;
      brand.dataset.pauseLogoVersion = "asset-pause-cream-v1";
      brand.innerHTML = logoImage("tds-pause-brand-img");
    });

    document.querySelectorAll(".tds-brand-lockup").forEach((brand) => {
      if (brand.dataset.pauseLogoVersion === "asset-hero-cream-v1") return;
      brand.dataset.pauseLogoVersion = "asset-hero-cream-v1";
      brand.innerHTML = logoImage("tds-hero-logo-img");
    });
  };

  const inject = () => {
    if (!document.getElementById("tds-pause-polish-style")) {
      const style = document.createElement("style");
      style.id = "tds-pause-polish-style";
      style.textContent = `
        .tds-nav {
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          min-height: 88px !important;
          padding: 18px clamp(20px, 5vw, 76px) !important;
          background: #3d2314 !important;
          border-bottom: 1px solid rgba(245, 232, 216, 0.14) !important;
        }

        .tds-nav .tds-nav-logo {
          position: relative !important;
          left: auto !important;
          top: auto !important;
          transform: none !important;
          display: inline-flex !important;
          align-items: center !important;
          width: auto !important;
          min-height: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          padding: 0 !important;
          opacity: 1 !important;
          filter: none !important;
          text-shadow: none !important;
          box-shadow: none !important;
          z-index: 2 !important;
        }

        .tds-nav .tds-nav-logo::before,
        .tds-nav .tds-nav-logo::after,
        .tds-mini-logo-icon,
        .tds-mini-logo-text,
        .tds-header-mark,
        .tds-header-wordmark {
          display: none !important;
          content: none !important;
        }

        .tds-header-logo-img {
          display: block !important;
          width: clamp(245px, 28vw, 350px) !important;
          height: auto !important;
          max-height: 60px !important;
          object-fit: contain !important;
          object-position: left center !important;
        }

        .tds-pause-nav-actions {
          position: relative !important;
          z-index: 2 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 14px !important;
          margin-left: auto !important;
        }

        .tds-pause-nav-actions button {
          min-height: 46px !important;
          border-radius: 999px !important;
          border: 1px solid rgba(245, 232, 216, .34) !important;
          background: transparent !important;
          color: #fff7ef !important;
          padding: 10px 22px !important;
          font: 800 .95rem var(--tds-sans, inherit) !important;
          letter-spacing: 0 !important;
          box-shadow: none !important;
        }

        .tds-pause-nav-actions button:last-child {
          border-color: #d9602d !important;
          background: #d9602d !important;
          color: #fff7ef !important;
          padding-inline: 25px !important;
        }

        .tds-pause-brand {
          border: 0 !important;
          background: transparent !important;
          padding: 0 !important;
          color: #fff7ef !important;
          opacity: 1 !important;
          filter: none !important;
        }

        .tds-pause-brand::before {
          display: none !important;
          content: none !important;
        }

        .tds-pause-brand-img {
          display: block !important;
          width: clamp(230px, 34vw, 360px) !important;
          height: auto !important;
          max-height: 64px !important;
          object-fit: contain !important;
          object-position: left center !important;
        }

        .tds-brand-lockup {
          display: inline-flex !important;
          align-items: center !important;
          width: min(720px, 86vw) !important;
          max-width: 100% !important;
          color: #fff7ef !important;
          opacity: 1 !important;
          filter: none !important;
        }

        .tds-brand-lockup > :not(.tds-hero-logo-img) {
          display: none !important;
        }

        .tds-hero-logo-img {
          display: block !important;
          width: min(680px, 86vw) !important;
          height: auto !important;
          opacity: 1 !important;
          filter: none !important;
          object-fit: contain !important;
          object-position: left center !important;
        }

        @media (max-width: 760px) {
          .tds-nav {
            min-height: 132px !important;
            align-items: flex-start !important;
            flex-direction: column !important;
            gap: 16px !important;
          }

          .tds-header-logo-img {
            width: min(310px, 88vw) !important;
            max-height: 56px !important;
          }

          .tds-pause-nav-actions {
            width: 100% !important;
            margin-left: 0 !important;
            gap: 10px !important;
          }

          .tds-pause-nav-actions button {
            flex: 1 1 0 !important;
            padding-inline: 12px !important;
            font-size: .9rem !important;
            white-space: nowrap !important;
          }

          .tds-pause-brand-img {
            width: min(300px, 86vw) !important;
          }

          .tds-hero-logo-img {
            width: min(520px, 86vw) !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    polish();
  };

  window.setTimeout(inject, 0);
  window.setTimeout(inject, 300);
  window.setTimeout(inject, 900);
  window.setInterval(polish, 800);
  window.addEventListener("popstate", () => window.setTimeout(inject, 80));
})();