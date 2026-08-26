(function () {
  const logoMarkup = () => `
    <span class="tds-refresh-logo" aria-hidden="true"></span>
    <span class="tds-refresh-wordmark">
      <span>The</span>
      <strong>Daily Session</strong>
      <small>Philadelphia</small>
    </span>
  `;

  const polish = () => {
    document.querySelectorAll(".tds-nav .tds-nav-logo, .tds-pause-brand").forEach((logo) => {
      if (logo.dataset.pauseLogoVersion !== "clean-cream-green-v2") {
        logo.dataset.pauseLogoVersion = "clean-cream-green-v2";
        logo.innerHTML = logoMarkup();
      }
    });

    document.querySelectorAll(".tds-brand-lockup").forEach((brand) => {
      if (brand.dataset.pauseLogoVersion !== "clean-cream-green-v2") {
        brand.dataset.pauseLogoVersion = "clean-cream-green-v2";
        brand.innerHTML = logoMarkup();
      }
    });
  };

  const inject = () => {
    if (!document.getElementById("tds-pause-polish-style")) {
      const style = document.createElement("style");
      style.id = "tds-pause-polish-style";
      style.textContent = `
        :root {
          --tds-cream: #f7f1e7;
          --tds-cream-2: #eee8dc;
          --tds-cream-3: #fffaf1;
          --tds-green: #24382c;
          --tds-rust: #c65d3d;
          --tds-ink: #302922;
          --tds-muted: #897d6b;
          --tds-line: #ded5c6;
          --tds-shadow: 0 22px 70px rgba(48, 41, 34, .12);
        }

        body,
        .tds-page,
        .tds-pause-page,
        .tds-join-page,
        .tds-auth-page,
        .tds-profile-page,
        .tds-business-page,
        .tds-provider-application-page,
        .tds-companies-page,
        .tds-company-detail-page,
        .tds-wellness-page,
        .tds-provider-detail-page,
        .tds-calendar-page,
        .tds-class-page,
        .tds-saved-page {
          background: var(--tds-cream-2) !important;
          color: var(--tds-ink) !important;
        }

        .tds-nav,
        .tds-pause-topbar {
          position: sticky !important;
          top: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 24px !important;
          min-height: 88px !important;
          padding: 18px clamp(20px, 5vw, 76px) !important;
          border-bottom: 1px solid var(--tds-line) !important;
          background: rgba(247, 241, 231, .96) !important;
          color: var(--tds-ink) !important;
          box-shadow: none !important;
          backdrop-filter: blur(10px) !important;
        }

        .tds-nav .tds-nav-logo,
        .tds-pause-brand,
        .tds-brand-lockup {
          display: inline-flex !important;
          align-items: center !important;
          gap: 14px !important;
          width: auto !important;
          max-width: min(640px, 100%) !important;
          min-height: 0 !important;
          margin: 0 !important;
          border: 0 !important;
          background: transparent !important;
          padding: 0 !important;
          color: var(--tds-green) !important;
          box-shadow: none !important;
          filter: none !important;
          opacity: 1 !important;
          cursor: pointer !important;
        }

        .tds-brand-lockup {
          gap: 18px !important;
          margin-bottom: 42px !important;
          cursor: default !important;
        }

        .tds-nav .tds-nav-logo::before,
        .tds-nav .tds-nav-logo::after,
        .tds-pause-brand::before,
        .tds-pause-brand::after,
        .tds-brand-lockup::before,
        .tds-brand-lockup::after,
        .tds-brand-lockup > :not(.tds-refresh-logo):not(.tds-refresh-wordmark) {
          display: none !important;
          content: none !important;
        }

        .tds-refresh-logo {
          position: relative !important;
          display: grid !important;
          place-items: center !important;
          width: 52px !important;
          height: 52px !important;
          flex: 0 0 52px !important;
          border-radius: 11px !important;
          background: var(--tds-rust) !important;
          box-shadow: none !important;
        }

        .tds-brand-lockup .tds-refresh-logo {
          width: 78px !important;
          height: 78px !important;
          flex-basis: 78px !important;
          border-radius: 14px !important;
        }

        .tds-refresh-logo::before {
          content: "" !important;
          width: 24px !important;
          height: 21px !important;
          border: 3px solid var(--tds-cream-3) !important;
          border-radius: 4px !important;
          background: linear-gradient(var(--tds-cream-3), var(--tds-cream-3)) 0 7px / 100% 3px no-repeat !important;
        }

        .tds-brand-lockup .tds-refresh-logo::before {
          width: 36px !important;
          height: 31px !important;
          border-width: 4px !important;
          border-radius: 6px !important;
          background: linear-gradient(var(--tds-cream-3), var(--tds-cream-3)) 0 10px / 100% 4px no-repeat !important;
        }

        .tds-refresh-logo::after {
          content: "" !important;
          position: absolute !important;
          width: 4px !important;
          height: 8px !important;
          border-radius: 999px !important;
          background: var(--tds-rust) !important;
          transform: translate(-7px, -12px) !important;
          box-shadow: 14px 0 0 var(--tds-rust) !important;
        }

        .tds-brand-lockup .tds-refresh-logo::after {
          width: 5px !important;
          height: 12px !important;
          transform: translate(-11px, -19px) !important;
          box-shadow: 22px 0 0 var(--tds-rust) !important;
        }

        .tds-refresh-wordmark {
          display: grid !important;
          gap: 2px !important;
          line-height: 1 !important;
          text-align: left !important;
        }

        .tds-brand-lockup .tds-refresh-wordmark {
          gap: 5px !important;
        }

        .tds-refresh-wordmark span {
          color: var(--tds-rust) !important;
          font: 800 .7rem var(--tds-sans, inherit) !important;
          letter-spacing: .18em !important;
          text-transform: uppercase !important;
        }

        .tds-refresh-wordmark strong {
          color: var(--tds-green) !important;
          font-family: var(--tds-serif, Georgia, serif) !important;
          font-size: clamp(1.35rem, 2vw, 1.8rem) !important;
          font-style: italic !important;
          font-weight: 700 !important;
          line-height: .95 !important;
        }

        .tds-brand-lockup .tds-refresh-wordmark strong {
          font-size: clamp(2.15rem, 4vw, 3.2rem) !important;
        }

        .tds-refresh-wordmark small {
          color: #9c927f !important;
          font: 800 .68rem var(--tds-sans, inherit) !important;
          letter-spacing: .18em !important;
          text-transform: uppercase !important;
        }

        .tds-nav button:not(.tds-nav-logo) {
          border: 0 !important;
          color: var(--tds-ink) !important;
          font-size: .9rem !important;
          font-weight: 850 !important;
          letter-spacing: .08em !important;
          text-transform: uppercase !important;
        }

        .tds-nav button:not(.tds-nav-logo):hover,
        .tds-nav button:not(.tds-nav-logo).is-active {
          color: var(--tds-rust) !important;
        }

        .tds-nav > div > button:last-child:not(.tds-nav-logo),
        .tds-pause-nav-actions button:last-child {
          min-height: 52px !important;
          border-radius: 7px !important;
          border-color: var(--tds-rust) !important;
          background: var(--tds-rust) !important;
          color: var(--tds-cream-3) !important;
          padding: 15px 26px !important;
        }

        .tds-pause-nav-actions {
          display: inline-flex !important;
          align-items: center !important;
          gap: 14px !important;
          margin-left: auto !important;
        }

        .tds-pause-nav-actions button {
          min-height: 46px !important;
          border-radius: 7px !important;
          border: 2px solid var(--tds-green) !important;
          background: transparent !important;
          color: var(--tds-green) !important;
          padding: 10px 22px !important;
          font: 850 .9rem var(--tds-sans, inherit) !important;
          letter-spacing: .08em !important;
          text-transform: uppercase !important;
          box-shadow: none !important;
        }

        .tds-nav-dropdown,
        .tds-modal-header,
        .tds-month-grid button,
        .tds-day-card,
        .tds-join-price-band,
        .tds-join-plan-toggle,
        .tds-join-stats,
        .tds-included-list,
        .tds-business-form,
        .tds-provider-form {
          border-color: var(--tds-line) !important;
          background: var(--tds-cream-3) !important;
          color: var(--tds-ink) !important;
        }

        .tds-hero {
          width: 100% !important;
          max-width: 1480px !important;
          min-height: min(860px, calc(100vh - 86px)) !important;
          padding: clamp(72px, 9vw, 148px) clamp(24px, 5vw, 72px) !important;
          gap: clamp(44px, 7vw, 104px) !important;
        }

        .tds-copy {
          max-width: 820px !important;
        }

        .tds-pill {
          border: 1px solid var(--tds-line) !important;
          background: rgba(255, 250, 241, .72) !important;
          color: var(--tds-ink) !important;
          padding: 12px 22px !important;
          font-weight: 850 !important;
          letter-spacing: .12em !important;
        }

        .tds-pill-dot,
        .tds-updated span {
          background: var(--tds-rust) !important;
        }

        h1,
        .tds-pause-copy h1,
        .tds-join-hero h1,
        .tds-join-section h2,
        .tds-pricing-section h2,
        .tds-faq-section h2,
        .tds-bottom-join h2,
        .tds-business-hero h1,
        .tds-provider-hero h1,
        .tds-companies-hero h1,
        .tds-company-detail-hero h1,
        .tds-wellness-hero h1,
        .tds-provider-detail-hero h1,
        .tds-calendar-hero h1,
        .tds-class-hero h1,
        .tds-saved-hero h1,
        .tds-auth-hero h1,
        .tds-profile-hero h1 {
          color: var(--tds-green) !important;
          font-family: var(--tds-serif, Georgia, serif) !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
        }

        .tds-hero h1 {
          max-width: 900px !important;
          font-size: clamp(4rem, 7.4vw, 7.15rem) !important;
          line-height: .94 !important;
        }

        .tds-pause-copy h1 {
          font-size: clamp(2.7rem, 5.6vw, 5.2rem) !important;
          line-height: .98 !important;
        }

        h1 em,
        .tds-join-hero em,
        .tds-join-section em,
        .tds-pricing-section em,
        .tds-faq-section em,
        .tds-bottom-join em {
          color: var(--tds-rust) !important;
        }

        .tds-copy p,
        .tds-pause-copy p,
        .tds-join-section > p,
        .tds-business-hero p,
        .tds-provider-hero p,
        .tds-companies-hero p,
        .tds-wellness-hero p,
        .tds-calendar-hero p,
        .tds-class-hero p,
        .tds-saved-hero p,
        .tds-auth-hero p,
        .tds-profile-hero p {
          color: #625b4e !important;
          font-size: clamp(1.08rem, 1.8vw, 1.38rem) !important;
          line-height: 1.65 !important;
        }

        .tds-panel {
          width: min(400px, 100%) !important;
          border: 0 !important;
          border-radius: 10px !important;
          background: var(--tds-green) !important;
          padding: clamp(32px, 4vw, 54px) !important;
          box-shadow: var(--tds-shadow) !important;
        }

        .tds-stat-label,
        .tds-schedule-header p:first-of-type,
        .tds-section-kicker,
        .tds-join-eyebrow,
        .tds-pause-copy span {
          color: var(--tds-rust) !important;
          font-weight: 850 !important;
          letter-spacing: .15em !important;
          text-transform: uppercase !important;
        }

        .tds-stat-value {
          color: var(--tds-cream-3) !important;
          font-family: var(--tds-serif, Georgia, serif) !important;
          font-size: clamp(3.8rem, 6vw, 5.35rem) !important;
          font-weight: 700 !important;
        }

        .tds-stat-description,
        .tds-updated p {
          color: rgba(247, 241, 231, .62) !important;
        }

        .tds-divider {
          background: rgba(247, 241, 231, .2) !important;
        }

        .tds-schedule,
        .tds-join-section,
        .tds-pricing-section,
        .tds-faq-section,
        .tds-calendar-shell,
        .tds-companies-shell,
        .tds-provider-shell,
        .tds-saved-shell {
          background: var(--tds-cream-2) !important;
          color: var(--tds-ink) !important;
        }

        .tds-schedule {
          padding: clamp(56px, 8vw, 92px) clamp(20px, 5vw, 78px) !important;
        }

        .tds-schedule-inner {
          width: min(1420px, 100%) !important;
        }

        .tds-schedule-header h2 {
          color: var(--tds-green) !important;
          font-size: clamp(3rem, 5vw, 4.5rem) !important;
          font-weight: 700 !important;
        }

        .tds-schedule-header p,
        .tds-session-card p,
        .tds-session-meta small,
        .tds-modal-body p {
          color: var(--tds-muted) !important;
        }

        .tds-filter-row button,
        .tds-load-more button,
        .tds-view-toggle button,
        .tds-month-head button,
        .tds-companies-controls button,
        .tds-companies-tabs button,
        .tds-saved-tabs button,
        .tds-plan-picker button,
        .tds-join-plan-toggle button,
        .tds-business-choice-group button,
        .tds-provider-choice-group button,
        .tds-provider-discount-grid button {
          border-color: var(--tds-line) !important;
          background: var(--tds-cream-3) !important;
          color: var(--tds-ink) !important;
          font-weight: 800 !important;
        }

        .tds-filter-row button.is-active,
        .tds-load-more button,
        .tds-view-toggle button.is-active,
        .tds-month-grid button.is-selected,
        .tds-companies-controls button.is-active,
        .tds-companies-tabs button.is-active,
        .tds-saved-tabs button.is-active,
        .tds-plan-picker button.is-selected,
        .tds-join-plan-toggle button.is-selected,
        .tds-business-choice-group button.is-selected,
        .tds-provider-choice-group button.is-selected,
        .tds-provider-discount-grid button.is-selected {
          border-color: var(--tds-green) !important;
          background: var(--tds-green) !important;
          color: var(--tds-cream-3) !important;
        }

        .tds-time-row span {
          border-color: var(--tds-line) !important;
          background: transparent !important;
          color: var(--tds-green) !important;
          font-size: 1.05rem !important;
        }

        .tds-time-row div {
          background: var(--tds-line) !important;
        }

        .tds-session-card,
        .tds-modal,
        .tds-empty-state,
        .tds-pause-card,
        .tds-perk-card,
        .tds-auth-card,
        .tds-profile-card,
        .tds-calendar-card,
        .tds-company-card,
        .tds-provider-card,
        .tds-saved-card,
        .tds-class-card {
          border: 0 !important;
          border-radius: 10px !important;
          background: var(--tds-cream-3) !important;
          box-shadow: none !important;
          color: var(--tds-ink) !important;
        }

        .tds-pause-card {
          box-shadow: var(--tds-shadow) !important;
        }

        .tds-session-card {
          grid-template-columns: 112px minmax(0, 1fr) auto !important;
          padding: 24px !important;
        }

        .tds-session-photo {
          width: 92px !important;
          height: 92px !important;
          border-radius: 9px !important;
          background-color: #eadfcf !important;
        }

        .tds-session-meta span,
        .tds-modal-body span {
          border-color: #ead8bd !important;
          background: #f3e7d0 !important;
          color: #8a6841 !important;
        }

        .tds-session-card h3,
        .tds-modal-header h3,
        .tds-empty-state strong,
        .tds-pause-card h2,
        .tds-perk-card h3,
        .tds-company-card h3,
        .tds-provider-card h3,
        .tds-saved-card h3,
        .tds-class-card h3 {
          color: var(--tds-green) !important;
          font-weight: 700 !important;
        }

        .tds-session-actions button,
        .tds-modal-body a,
        .tds-modal-body button,
        .tds-pause-card button,
        .tds-auth-form button,
        .tds-auth-main-button,
        .tds-profile-card > button,
        .tds-profile-actions button,
        .tds-join-cta,
        .tds-business-submit,
        .tds-provider-submit,
        .tds-class-actions button,
        .tds-class-empty button,
        .tds-company-body footer button,
        .tds-company-detail-hero button,
        .tds-company-upcoming button,
        .tds-provider-card button:not(.tds-provider-card-photo),
        .tds-provider-detail-hero > button,
        .tds-provider-detail-content aside > button,
        .tds-saved-card button,
        .tds-save-class-button {
          border: 0 !important;
          border-radius: 7px !important;
          background: var(--tds-green) !important;
          color: var(--tds-cream-3) !important;
          font-weight: 850 !important;
        }

        .tds-session-actions a,
        .tds-link-button {
          border: 2px solid var(--tds-green) !important;
          border-radius: 7px !important;
          background: transparent !important;
          color: var(--tds-green) !important;
          font-weight: 850 !important;
        }

        .tds-join-hero,
        .tds-included-section,
        .tds-business-hero,
        .tds-provider-hero,
        .tds-companies-hero,
        .tds-company-detail-hero,
        .tds-wellness-hero,
        .tds-provider-detail-hero,
        .tds-calendar-hero,
        .tds-class-hero,
        .tds-saved-hero {
          background: var(--tds-cream-2) !important;
          color: var(--tds-ink) !important;
        }

        .tds-join-glow {
          display: none !important;
        }

        .tds-join-price-band strong,
        .tds-join-stats strong {
          color: var(--tds-green) !important;
        }

        .tds-join-price-band span,
        .tds-join-billing-note,
        .tds-join-note,
        .tds-join-stats span,
        .tds-included-section > div:first-child p {
          color: var(--tds-muted) !important;
        }

        input,
        textarea,
        select {
          border-color: var(--tds-line) !important;
          background: var(--tds-cream-3) !important;
          color: var(--tds-ink) !important;
        }

        @media (max-width: 860px) {
          .tds-nav,
          .tds-pause-topbar {
            min-height: 132px !important;
            align-items: flex-start !important;
            flex-direction: column !important;
            gap: 16px !important;
          }

          .tds-refresh-wordmark small {
            display: none !important;
          }

          .tds-pause-nav-actions {
            width: 100% !important;
            margin-left: 0 !important;
            gap: 10px !important;
          }

          .tds-pause-nav-actions button {
            flex: 1 1 0 !important;
            padding-inline: 12px !important;
            font-size: .84rem !important;
            white-space: nowrap !important;
          }

          .tds-hero {
            min-height: auto !important;
            padding-top: 48px !important;
          }

          .tds-brand-lockup {
            gap: 14px !important;
            margin-bottom: 30px !important;
          }

          .tds-brand-lockup .tds-refresh-logo {
            width: 58px !important;
            height: 58px !important;
            flex-basis: 58px !important;
          }

          .tds-brand-lockup .tds-refresh-logo::before {
            width: 28px !important;
            height: 24px !important;
            border-width: 3px !important;
          }

          .tds-brand-lockup .tds-refresh-logo::after {
            transform: translate(-8px, -14px) !important;
            box-shadow: 16px 0 0 var(--tds-rust) !important;
          }

          .tds-brand-lockup .tds-refresh-wordmark strong {
            font-size: clamp(1.75rem, 8vw, 2.45rem) !important;
          }

          .tds-hero h1 {
            font-size: clamp(3rem, 15vw, 4.5rem) !important;
          }

          .tds-panel {
            width: 100% !important;
          }

          .tds-session-card {
            grid-template-columns: 72px minmax(0, 1fr) !important;
            gap: 14px !important;
            padding: 18px !important;
          }

          .tds-session-actions {
            grid-column: 1 / -1 !important;
            grid-template-columns: 1fr 1fr !important;
          }

          .tds-session-photo {
            width: 72px !important;
            height: 72px !important;
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
