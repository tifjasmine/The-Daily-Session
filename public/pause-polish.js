(function () {
  const polish = () => {
    document.querySelectorAll(".tds-nav .tds-nav-logo").forEach((logo) => {
      if (logo.dataset.pauseLogoVersion === "compact-horizontal") return;
      logo.dataset.pauseLogoVersion = "compact-horizontal";
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
          min-height: 76px !important;
          padding: 16px clamp(20px, 5vw, 72px) !important;
          background: #3d2314 !important;
          border-bottom: 1px solid rgba(245, 232, 216, 0.14) !important;
        }

        .tds-nav .tds-nav-logo {
          position: absolute !important;
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 9px !important;
          width: auto !important;
          min-height: 42px !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: #fff7ef !important;
          padding: 0 !important;
          opacity: 1 !important;
          text-shadow: none !important;
          filter: none !important;
          z-index: 1 !important;
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
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          overflow: hidden;
          border-radius: 7px;
          background: linear-gradient(#dd6631 0 36%, #6a341d 36% 100%);
          box-shadow: inset 0 -1px 0 rgba(255,255,255,.1);
        }

        .tds-header-rings i {
          position: absolute;
          top: -3px;
          width: 4px;
          height: 12px;
          border-radius: 999px;
          background: #3d2314;
        }

        .tds-header-rings i:first-child { left: 9px; }
        .tds-header-rings i:last-child { right: 9px; }

        .tds-header-grid {
          position: absolute;
          left: 7px;
          right: 7px;
          bottom: 6px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;
        }

        .tds-header-grid i {
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 2px;
          background: #f2b36d;
        }

        .tds-header-grid i:nth-child(n+4) { background: rgba(242, 179, 109, .58); }

        .tds-header-wordmark {
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: 6px;
          align-items: end;
          line-height: 1;
          transform: translateY(1px);
        }

        .tds-header-wordmark small {
          grid-column: 1;
          align-self: center;
          color: #d9824a;
          font-family: var(--tds-sans, inherit);
          font-size: .48rem;
          font-weight: 900;
          letter-spacing: .2em;
          transform: translateY(-7px);
        }

        .tds-header-wordmark strong {
          grid-column: 2;
          color: #fff7ef;
          font-family: var(--tds-serif, Georgia, serif);
          font-size: clamp(1.12rem, 1.9vw, 1.42rem);
          font-weight: 850;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .tds-pause-nav-actions {
          position: relative !important;
          z-index: 2 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 10px !important;
          margin-left: auto !important;
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
            min-height: 118px !important;
            gap: 12px !important;
            justify-content: flex-start !important;
          }

          .tds-nav .tds-nav-logo {
            top: 18px !important;
            transform: translateX(-50%) !important;
          }

          .tds-pause-nav-actions {
            width: 100% !important;
            margin-top: 54px !important;
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
