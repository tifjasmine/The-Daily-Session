(function () {
  const buildLogo = () => {
    document.querySelectorAll(".tds-nav .tds-nav-logo").forEach((logo) => {
      if (logo.dataset.pauseLogoPolished === "true") return;
      logo.dataset.pauseLogoPolished = "true";
      logo.innerHTML = `
        <span class="tds-mini-logo-icon" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </span>
        <span class="tds-mini-logo-text">
          <small>THE</small>
          <strong>Daily Session</strong>
          <em>PHILADELPHIA</em>
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
          min-height: 84px !important;
          padding: 16px clamp(20px, 5vw, 72px) !important;
          background: #3d2314 !important;
          border-bottom: 1px solid rgba(245, 232, 216, 0.14) !important;
        }

        .tds-nav .tds-nav-logo {
          display: inline-flex !important;
          align-items: center !important;
          gap: 12px !important;
          min-height: 52px !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: #fff7ef !important;
          padding: 0 !important;
          opacity: 1 !important;
          text-shadow: none !important;
          filter: none !important;
        }

        .tds-nav .tds-nav-logo::before,
        .tds-nav .tds-nav-logo::after {
          display: none !important;
          content: none !important;
        }

        .tds-mini-logo-icon {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 7px);
          grid-template-rows: repeat(3, 7px);
          gap: 4px;
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          align-content: end;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(242, 179, 109, .22);
          background: linear-gradient(#d9602d 0 30%, #5c2f1b 30% 100%);
          padding: 19px 8px 7px;
          box-shadow: inset 0 -1px 0 rgba(255, 255, 255, .1);
        }

        .tds-mini-logo-icon::before,
        .tds-mini-logo-icon::after {
          content: '';
          position: absolute;
          top: -5px;
          width: 5px;
          height: 17px;
          border-radius: 999px;
          background: #3d2314;
        }

        .tds-mini-logo-icon::before { left: 16px; }
        .tds-mini-logo-icon::after { right: 16px; }

        .tds-mini-logo-icon i {
          display: block;
          border-radius: 3px;
          background: rgba(242, 179, 109, .72);
        }

        .tds-mini-logo-icon i:nth-child(n+4) { background: rgba(214, 150, 86, .48); }
        .tds-mini-logo-icon i:nth-child(n+7) { background: rgba(174, 112, 62, .36); }

        .tds-mini-logo-text {
          display: grid;
          align-content: center;
          gap: 3px;
          line-height: 1;
          transform: translateY(1px);
        }

        .tds-mini-logo-text small,
        .tds-mini-logo-text em {
          color: #d9824a;
          font-family: var(--tds-sans, inherit);
          font-style: normal;
          font-weight: 850;
          letter-spacing: .22em;
        }

        .tds-mini-logo-text small {
          font-size: .48rem;
        }

        .tds-mini-logo-text strong {
          color: #fff7ef;
          font-family: var(--tds-serif, Georgia, serif);
          font-size: clamp(1.05rem, 1.8vw, 1.32rem);
          font-weight: 850;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .tds-mini-logo-text strong::after {
          content: '';
          display: block;
          width: 100%;
          height: 1px;
          margin-top: 5px;
          background: #d9602d;
        }

        .tds-mini-logo-text em {
          font-size: .52rem;
        }

        .tds-pause-nav-actions {
          display: inline-flex !important;
          align-items: center !important;
          gap: 10px !important;
        }

        .tds-pause-nav-actions button {
          min-height: 42px !important;
          border-radius: 999px !important;
          border: 1px solid rgba(245, 232, 216, .24) !important;
          background: rgba(255, 247, 239, .06) !important;
          color: #f5e8d8 !important;
          padding: 10px 18px !important;
          font: 750 .94rem var(--tds-sans, inherit) !important;
          letter-spacing: 0 !important;
          box-shadow: none !important;
        }

        .tds-pause-nav-actions button:last-child {
          border-color: #d9602d !important;
          background: #d9602d !important;
          color: #fff7ef !important;
          padding-inline: 20px !important;
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

          .tds-mini-logo-icon {
            width: 42px;
            height: 42px;
            flex-basis: 42px;
            grid-template-columns: repeat(3, 6px);
            grid-template-rows: repeat(3, 6px);
            gap: 3px;
            padding: 17px 7px 6px;
          }

          .tds-mini-logo-text em { display: none; }

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

    buildLogo();
  };

  window.setTimeout(inject, 0);
  window.setTimeout(inject, 300);
  window.setInterval(buildLogo, 800);
  window.addEventListener("popstate", () => window.setTimeout(inject, 80));
})();
