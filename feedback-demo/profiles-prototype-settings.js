(() => {
  const settingsButton = document.querySelector("#prototypeSettingsButton");
  const settingsPanel = document.querySelector("#prototypeSettingsPanel");
  const settingsForm = document.querySelector("#prototypeSettingsForm");
  const resetButton = document.querySelector("#resetPrototypeSettings");
  const workspace = document.querySelector("#workspace");
  const overviewCluster = document.querySelector("#overviewCluster");
  const overviewPanel = document.querySelector("#overviewPanel");
  const detailPanel = document.querySelector("#detailPanel");

  if (!settingsButton || !settingsPanel || !settingsForm || !workspace) return;

  const defaults = {
    edgeRailsSetting: true,
    smoothRailSetting: true,
    continuousResizeSetting: true,
    fullscreenRailsSetting: true,
    followingPanelSetting: false,
  };

  function closeSettings(restoreFocus = false) {
    settingsPanel.hidden = true;
    settingsButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) settingsButton.focus();
  }

  function openSettings() {
    settingsPanel.hidden = false;
    settingsButton.setAttribute("aria-expanded", "true");
    settingsPanel.querySelector("input")?.focus({ preventScroll: true });
  }

  function restartFullscreenIfNeeded() {
    const maximizeButton = workspace.querySelector(".panel.is-maximized .maximize-action");
    if (!maximizeButton) return;
    maximizeButton.click();
    requestAnimationFrame(() => maximizeButton.click());
  }

  function openOverviewIfFollowModeApplied() {
    if (workspace.dataset.followSpaceApplied !== "true") return;
    delete workspace.dataset.followSpaceApplied;
    if (overviewCluster?.classList.contains("is-main-collapsed")) {
      overviewPanel?.querySelector(".panel-header")?.click();
    }
  }

  function giveFollowingPanelFullSpace() {
    if (document.body.dataset.followingPanelSpace !== "full") return;
    if (workspace.classList.contains("has-maximized")) return;
    if (!detailPanel || detailPanel.classList.contains("is-collapsed") || detailPanel.classList.contains("is-disabled")) return;
    if (overviewCluster?.classList.contains("is-main-collapsed")) return;
    overviewPanel?.querySelector(".collapse-to-rail-action")?.click();
    workspace.dataset.followSpaceApplied = "true";
  }

  function applySetting(input, restartFocus = true) {
    switch (input.id) {
      case "edgeRailsSetting":
        document.body.dataset.edgeRails = String(input.checked);
        break;
      case "smoothRailSetting":
        document.body.dataset.railTransition = input.checked ? "classic" : "instant";
        break;
      case "continuousResizeSetting":
        document.body.dataset.continuousResize = String(input.checked);
        break;
      case "fullscreenRailsSetting":
        document.body.dataset.fullscreenOthers = input.checked ? "rails" : "hidden";
        if (restartFocus) restartFullscreenIfNeeded();
        break;
      case "followingPanelSetting":
        document.body.dataset.followingPanelSpace = input.checked ? "full" : "split";
        if (input.checked) requestAnimationFrame(giveFollowingPanelFullSpace);
        else openOverviewIfFollowModeApplied();
        break;
      default:
        return;
    }
    window.dispatchEvent(new Event("resize"));
  }

  settingsButton.addEventListener("click", () => {
    if (settingsPanel.hidden) openSettings();
    else closeSettings(true);
  });

  settingsForm.addEventListener("change", (event) => {
    if (event.target.matches('input[type="checkbox"]')) applySetting(event.target);
  });

  resetButton?.addEventListener("click", () => {
    Object.entries(defaults).forEach(([id, checked]) => {
      const input = document.querySelector(`#${id}`);
      if (!input) return;
      input.checked = checked;
      applySetting(input, false);
    });
    restartFullscreenIfNeeded();
  });

  document.addEventListener("pointerdown", (event) => {
    if (settingsPanel.hidden || event.target.closest(".prototype-settings")) return;
    closeSettings();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || settingsPanel.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeSettings(true);
  }, true);

  workspace.addEventListener("click", (event) => {
    const row = event.target.closest(".profile-row");
    const opensDetail = row && !event.target.closest(".profile-select-target, .profile-check");
    const opensDetailRail = event.target.closest("#detailPanel.is-collapsed .panel-header");
    if (opensDetail || opensDetailRail) requestAnimationFrame(() => requestAnimationFrame(giveFollowingPanelFullSpace));
  }, true);

  workspace.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key) || !event.target.closest(".profile-row")) return;
    requestAnimationFrame(() => requestAnimationFrame(giveFollowingPanelFullSpace));
  }, true);

  settingsForm.querySelectorAll('input[type="checkbox"]').forEach((input) => applySetting(input, false));
})();

