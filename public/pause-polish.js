(function () {
  const inject = () => {
    if (document.getElementById("tds-pause-polish-style")) return;
    const style = document.createElement("style");
    style.id = "tds-pause-polish-style";
    style.textContent = `
      .tds-nav {
        min-height: 72px !important;
        padding: 16px clamp(20px, 5vw, 72px) !important;
        background: #3d2314 !important;
        border-bottom: 1px solid rgba(245, 232, 216, 0.14) !important;
      }

      .tds-nav .tds-nav-logo {
        display: inline-flex !important;
        align-items: center !important;
        gap: 10px !important;
        min-height: 42px !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        color: #fff7ef !important;
        padding: 0 !important;
        font-family: var(--tds-serif, Georgia, serif) !important;
        font-size: clamp(1.05rem, 1.8vw, 1.28rem) !important;
        font-weight: 850 !important;
        line-height: 1 !important;
        letter-spacing: 0 !important;
        opacity: 1 !important;
        text-shadow: none !important;
        filter: none !important;
      }

      .tds-nav .tds-nav-logo::before {
        content: '' !important;
        width: 28px !important;
        height: 28px !important;
        flex: 0 0 28px !important;
        border-radius: 7px !important;
        background:
          linear-gradient(#d9602d 0 38%, #5c2f1b 38% 100%) !important;
        box-shadow: inset 0 -1px 0 rgba(255,255,255,.12) !important;
      }

      .tds-nav .tds-nav-logo::after {
        content: '' !important;
        width: 34px !important;
        height: 2px !important;
        margin-left: 2px !important;
        background: #d9602d !important;
        transform: translateY(1px) !important;
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
  };

  window.setTimeout(inject, 0);
  window.setTimeout(inject, 300);
  window.addEventListener("popstate", () => window.setTimeout(inject, 80));
})();
