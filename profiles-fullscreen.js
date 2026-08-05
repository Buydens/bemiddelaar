(() => {
  const fullscreenWorkspace = document.querySelector("#workspace");
  const fullscreenButtons = [...document.querySelectorAll(".maximize-action")];
  const fullscreenModeLabel = document.querySelector("#modeLabel");
  const fullscreenVisibleLabel = document.querySelector("#visiblePanelLabel");

  function panelName(panel) {
    return panel.querySelector("h1, h2")?.textContent.trim() || "Paneel";
  }

  function setButtonState(panel, maximized) {
    const button = panel.querySelector(".maximize-action");
    if (!button) return;
    const label = maximized ? "Volledige focus verlaten" : "Paneel maximaliseren";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(maximized));
    button.title = maximized ? "Herstel paneelindeling" : "Maximaliseren";
  }

  function restoreFullscreen() {
    const maximizedPanel = fullscreenWorkspace.querySelector(".panel.is-maximized");
    if (!maximizedPanel) return null;
    const action = maximizedPanel.querySelector(".maximize-action");
    maximizedPanel.classList.remove("is-maximized");
    maximizedPanel.closest(".overview-cluster")?.classList.remove("has-maximized-child");
    fullscreenWorkspace.classList.remove("has-maximized");
    setButtonState(maximizedPanel, false);
    if (typeof updateWorkspaceStatus === "function") updateWorkspaceStatus();
    return action;
  }

  function maximizePanel(panel) {
    const alreadyMaximized = panel.classList.contains("is-maximized");
    restoreFullscreen();
    if (alreadyMaximized) return;

    panel.classList.add("is-maximized");
    panel.closest(".overview-cluster")?.classList.add("has-maximized-child");
    fullscreenWorkspace.classList.add("has-maximized");
    setButtonState(panel, true);
    fullscreenModeLabel.textContent = `Volledige focus · ${panelName(panel)}`;
    fullscreenVisibleLabel.textContent = "1 paneel in volledige focus";
  }

  fullscreenButtons.forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      maximizePanel(button.closest(".panel"));
    });
  });

  fullscreenWorkspace.addEventListener("click", (event) => {
    if (!fullscreenWorkspace.classList.contains("has-maximized")) return;
    if (event.target.closest("#closeFilterButton, .collapse-dependent, .back-action, #editDetailButton")) {
      restoreFullscreen();
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !fullscreenWorkspace.classList.contains("has-maximized")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = restoreFullscreen();
    action?.focus();
  }, true);
})();
