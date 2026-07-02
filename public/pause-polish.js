(function () {
  const polish = () => {
    document.querySelectorAll(".tds-nav .tds-nav-logo").forEach((logo) => {
      if (logo.dataset.pauseLogoVersion === "left-horizontal-cream") return;
      logo.dataset.pauseLogoVersion = "left-horizontal-cream";
      logo.innerHTML = `
        <span class="tds-header-mark" aria-hidden="true">
          <span class="tds-header-rings"><i></i><i></i></span>
          <span class="tds-header-grid"><i></i><i></i><i></i><i></i><i></i><i></i></span>
        </span>
        <span class="tds-header-wordmark">
          <small>THE</small>
          <strong>Daily Session</strong>
        </span>
      `;
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
          min-height: 82px !important;
          padding: 16px clamp(20px, 5vw, 72px) !important;
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
          gap: 10px !important;
          width: auto !important;
          min-height: 46px !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: #fff7ef !important;
          padding: 0 !important;
          opacity: 1 !important;
          text-shadow: none !important;
          filter: none !important;
          z-index: 2 !important;
        }

        .tds-nav .tds-nav-logo::before,
        .tds-nav .tds-nav-logo::after,
        .tds-mini-logo-icon,
        .tds-mini-logo-text {
          display: none !important;
          content: none !important;
        }

        .tds-header-mark {
          position: relative;
          display: block;
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          overflow: hidden;
          border-radius: 9px;
          background: linear-gradient(#dd6631 0 36%, #5b2d19 36% 100%);
          box-shadow: inset 0 -1px 0 rgba(255,255,255,.12), 0 0 0 1px rgba(245,232,216,.1);
        }

        .tds-header-rings i {
          position: absolute;
          top: -3px;
          width: 5px;
          height: 15px;
          border-radius: 999px;
          background: #fff7ef;
          opacity: .96;
        }

        .tds-header-rings i:first-child { left: 11px; }
        .tds-header-rings i:last-child { right: 11px; }

        .tds-header-grid {
          position: absolute;
          left: 9px;
          right: 9px;
          bottom: 8px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        .tds-header-grid i {
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 2px;
          background: #f7dfc2;
        }

        .tds-header-grid i:nth-child(2),
        .tds-header-grid i:nth-child(5) { background: #f2b36d; }
        .tds-header-grid i:nth-child(3),
        .tds-header-grid i:nth-child(6) { background: rgba(247,223,194,.68); }

        .tds-header-wordmark {
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: 7px;
          align-items: end;
          line-height: 1;
          transform: translateY(1px);
        }

        .tds-header-wordmark small {
          grid-column: 1;
          align-self: center;
          color: #d9824a;
          font-family: var(--tds-sans, inherit);
          font-size: .5rem;
          font-weight: 900;
          letter-spacing: .22em;
          transform: translateY(-7px);
        }

        .tds-header-wordmark strong {
          grid-column: 2;
          color: #fff7ef;
          font-family: var(--tds-serif, Georgia, serif);
          font-size: clamp(1.22rem, 2vw, 1.55rem);
          font-weight: 850;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .tds-pause-nav-actions {
          position: relative !important;
          z-index: 2 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 12px !important;
          margin-left: auto !important;
        }

        .tds-pause-nav-actions button {
          min-height: 42px !important;
          border-radius: 999px !important;
          border: 1px solid rgba(245, 232, 216, .3) !important;
          background: transparent !important;
          color: #f5e8d8 !important;
          padding: 10px 18px !important;
          font: 750 .92rem var(--tds-sans, inherit) !important;
          letter-spacing: 0 !important;
          box-shadow: none !important;
        }

        .tds-pause-nav-actions button:last-child {
          border-color: #d9602d !important;
          background: #d9602d !important;
          color: #fff7ef !important;
          padding-inline: 21px !important;
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
            min-height: 124px !important;
            align-items: flex-start !important;
            flex-direction: column !important;
            gap: 14px !important;
          }

          .tds-header-mark {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
          }

          .tds-header-wordmark strong {
            font-size: 1.18rem !important;
          }

          .tds-pause-nav-actions {
            width: 100% !important;
            margin-left: 0 !important;
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
