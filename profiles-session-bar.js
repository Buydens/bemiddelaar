(() => {
  const topbar = document.querySelector(".topbar");
  const sessionButton = document.querySelector("#sessionButton");
  const sessionPanel = document.querySelector("#sessionPanel");
  const sessionScrim = document.querySelector("#sessionScrim");
  const settingsButton = document.querySelector("#prototypeSettingsButton");
  const settingsPanel = document.querySelector("#prototypeSettingsPanel");

  if (!topbar || !sessionButton || !sessionPanel || !sessionScrim) return;

  function isOpen() {
    return topbar.classList.contains("is-session-open");
  }

  function setSessionOpen(open, restoreFocus = false) {
    if (open && settingsPanel && !settingsPanel.hidden) settingsButton?.click();
    topbar.classList.toggle("is-session-open", open);
    document.body.classList.toggle("is-session-open", open);
    sessionButton.setAttribute("aria-expanded", String(open));
    sessionButton.setAttribute("aria-label", open ? "Sessie sluiten" : "Sessie openen");
    sessionPanel.setAttribute("aria-hidden", String(!open));
    sessionPanel.inert = !open;
    sessionScrim.setAttribute("aria-hidden", String(!open));
    if (restoreFocus) sessionButton.focus();
  }

  sessionButton.addEventListener("click", () => setSessionOpen(!isOpen()));
  sessionScrim.addEventListener("click", () => setSessionOpen(false, true));

  settingsButton?.addEventListener("click", () => {
    if (isOpen()) setSessionOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setSessionOpen(false, true);
  }, true);
})();
