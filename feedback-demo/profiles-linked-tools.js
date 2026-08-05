(() => {
  const linkedWorkspace = document.querySelector("#workspace");
  const linkedOverviewCluster = document.querySelector("#overviewCluster");
  const linkedOverviewPanel = document.querySelector("#overviewPanel");
  const linkedDetailCluster = document.querySelector("#detailCluster");
  const linkedFilterPanel = document.querySelector("#filterPanel");
  const linkedDetailPanel = document.querySelector("#detailPanel");
  const linkedEditPanel = document.querySelector("#crudPanel");
  const mainDivider = document.querySelector("#mainDivider");
  const editDivider = document.querySelector("#editDivider");
  const linkedModeLabel = document.querySelector("#modeLabel");
  const linkedVisibleLabel = document.querySelector("#visiblePanelLabel");
  const fullscreenButtons = [...document.querySelectorAll(".maximize-action")];
  const classicResizeFeel = document.body.dataset.resizeFeel === "classic";
  const managedRailActions = document.body.dataset.railAction === "managed";
  const preserveOwnerFullscreen = document.body.dataset.panelManagement === "owner-groups"
    || document.body.dataset.preserveOwnerFullscreen === "true";

  if (!linkedWorkspace || !linkedDetailCluster || !linkedDetailPanel || !linkedEditPanel) return;

  let mainDrag = null;
  let editDrag = null;
  let fullscreenRailSnapshot = null;

  function continuousMainResizeEnabled() {
    return document.body.dataset.continuousResize === "true";
  }

  function fullscreenOthersAsRails() {
    return document.body.dataset.fullscreenOthers === "rails";
  }

  function isCollapsed(panel) {
    return panel.classList.contains("is-collapsed");
  }

  function panelName(panel) {
    return panel?.querySelector("h1, h2")?.textContent.trim() || panel?.dataset.panel || "Paneel";
  }

  function callWorkspaceStatus() {
    if (typeof updateWorkspaceStatus === "function") updateWorkspaceStatus();
    requestAnimationFrame(updateLinkedStatus);
  }

  function updateLinkedStatus() {
    if (!linkedVisibleLabel || !linkedFilterPanel) return;
    if (preserveOwnerFullscreen && linkedWorkspace.classList.contains("has-maximized")) {
      const owner = linkedWorkspace.querySelector(".panel.is-maximized");
      const ownerCluster = owner?.closest(".panel-cluster");
      const linkedNames = ownerCluster
        ? [...ownerCluster.children]
          .filter((item) => item.matches?.(".panel:not(.is-collapsed):not([hidden])") && item !== owner)
          .map(panelName)
        : [];
      linkedVisibleLabel.textContent = `${panelName(owner)} in volledige focus${linkedNames.length ? ` + ${linkedNames.join(" + ")}` : ""}${fullscreenOthersAsRails() ? " · andere groepen als rail" : ""}`;
      return;
    }
    if (linkedOverviewCluster.classList.contains("is-main-collapsed")) {
      linkedVisibleLabel.textContent = isCollapsed(linkedEditPanel)
        ? "Overzicht als rail | Detail"
        : "Overzicht als rail | Detail → Bewerken";
      return;
    }
    if (!linkedFilterPanel.hidden) {
      linkedVisibleLabel.textContent = "Filters → Overzicht · profielcontext als rails";
    } else if (!isCollapsed(linkedDetailPanel) && !isCollapsed(linkedEditPanel)) {
      linkedVisibleLabel.textContent = "Overzicht | Detail → Bewerken";
    } else if (!isCollapsed(linkedDetailPanel)) {
      linkedVisibleLabel.textContent = document.body.dataset.editPresentation === "subpanel"
        ? "Overzicht + Detail · Bewerken gesloten"
        : "Overzicht + Detail · Bewerken als rail";
    } else {
      linkedVisibleLabel.textContent = "Overzicht + Detail als rail";
    }
  }

  function setLinkedPanel(panel, collapsed, disabled = false) {
    if (typeof setPanelCollapsed === "function") {
      setPanelCollapsed(panel, collapsed, disabled);
      return;
    }
    panel.classList.toggle("is-collapsed", collapsed);
    panel.classList.toggle("is-disabled", disabled);
    panel.setAttribute("aria-disabled", String(disabled));
  }

  function openDetailPair() {
    if (linkedDetailPanel.classList.contains("is-disabled")) return;
    if (linkedFilterPanel && !linkedFilterPanel.hidden && typeof closeFilterPanel === "function") {
      closeFilterPanel(false);
    }
    if (typeof openDependentPanels === "function") {
      openDependentPanels();
    } else {
      setLinkedPanel(linkedDetailPanel, false, false);
      setLinkedPanel(linkedEditPanel, false, false);
    }
    callWorkspaceStatus();
  }

  function closeDetailPair() {
    setLinkedPanel(linkedDetailPanel, true, false);
    setLinkedPanel(linkedEditPanel, true, false);
    callWorkspaceStatus();
  }

  function openOverviewFromRail() {
    linkedOverviewCluster.classList.remove("is-main-collapsed");
    const header = linkedOverviewPanel?.querySelector(".panel-header");
    if (header) {
      header.tabIndex = -1;
      header.removeAttribute("role");
      header.removeAttribute("aria-label");
    }
    callWorkspaceStatus();
    requestAnimationFrame(syncMainDivider);
  }

  function closeOverviewToRail() {
    if (linkedFilterPanel && !linkedFilterPanel.hidden && typeof closeFilterPanel === "function") {
      closeFilterPanel(false);
    }
    linkedOverviewCluster.classList.add("is-main-collapsed");
    const header = linkedOverviewPanel?.querySelector(".panel-header");
    if (header) {
      header.tabIndex = 0;
      header.setAttribute("role", "button");
      header.setAttribute("aria-label", "Overzicht opnieuw openen");
    }
    callWorkspaceStatus();
    requestAnimationFrame(syncMainDivider);
  }

  /*
   * Paneeleigenaars krijgen dezelfde beheeractie op basis van hun rol en de
   * railzijde van hun groep. Daardoor hoeft een toekomstig paneel de knop niet
   * zelf te dupliceren in zijn HTML.
   */
  function createRailAction(owner, cluster) {
    const actions = owner.querySelector(":scope > .panel-header .panel-actions");
    if (!actions || actions.querySelector(".collapse-to-rail-action")) return;

    const side = cluster.dataset.railSide === "left" ? "left" : "right";
    const button = document.createElement("button");
    button.className = "panel-action collapse-to-rail-action";
    button.type = "button";
    button.dataset.railSide = side;
    button.setAttribute("aria-label", `${panelName(owner)} naar ${side === "left" ? "linker" : "rechter"}rail`);
    button.title = "Naar rail";
    button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 18 18"><path class="rail-action-frame" d="M3 3.25h12v11.5H3z" /><path class="rail-action-edge" d="M13 3.25v11.5" /><path class="rail-action-arrow" d="m8.25 6.25 2.75 2.75-2.75 2.75M11 9H5.75" /></svg>';

    const legacyOwnerClose = actions.querySelector(".collapse-dependent");
    actions.insertBefore(button, legacyOwnerClose || null);
  }

  function ensureManagedRailActions(root = linkedWorkspace) {
    if (!managedRailActions) return;
    root.querySelectorAll(".panel-cluster[data-rail-side]").forEach((cluster) => {
      const owner = cluster.querySelector(":scope > .panel[data-panel-role='owner']");
      if (owner) createRailAction(owner, cluster);
    });
  }

  function setManagedRailHeader(owner, collapsed) {
    const header = owner.querySelector(":scope > .panel-header");
    if (!header) return;
    header.tabIndex = collapsed ? 0 : -1;
    if (collapsed) {
      header.setAttribute("role", "button");
      header.setAttribute("aria-label", `${panelName(owner)} opnieuw openen`);
    } else {
      header.removeAttribute("role");
      header.removeAttribute("aria-label");
    }
  }

  function closeGenericOwnerToRail(owner, cluster) {
    cluster.querySelectorAll(":scope > .panel[data-panel-role='subpanel']").forEach((panel) => {
      panel.hidden = true;
      setLinkedPanel(panel, true, false);
    });
    cluster.classList.add("is-managed-rail");
    owner.classList.add("is-managed-owner-rail");
    setManagedRailHeader(owner, true);
    callWorkspaceStatus();
  }

  function openGenericOwnerFromRail(owner, cluster) {
    cluster.classList.remove("is-managed-rail");
    owner.classList.remove("is-managed-owner-rail");
    setLinkedPanel(owner, false, false);
    setManagedRailHeader(owner, false);
    callWorkspaceStatus();
  }

  function collapseManagedOwnerToRail(owner) {
    const cluster = owner?.closest(".panel-cluster[data-rail-side]");
    if (!cluster) return;
    if (linkedWorkspace.classList.contains("has-maximized")) restoreFullscreen();

    if (cluster === linkedOverviewCluster || owner === linkedOverviewPanel) {
      closeOverviewToRail();
    } else if (cluster === linkedDetailCluster || owner === linkedDetailPanel) {
      closeDetailPair();
    } else {
      closeGenericOwnerToRail(owner, cluster);
    }
  }

  if (managedRailActions) {
    ensureManagedRailActions();

    linkedWorkspace.addEventListener("click", (event) => {
      const button = event.target.closest(".collapse-to-rail-action");
      if (button) {
        event.preventDefault();
        event.stopPropagation();
        collapseManagedOwnerToRail(button.closest(".panel[data-panel-role='owner']"));
        return;
      }

      const owner = event.target.closest(".panel[data-panel-role='owner']");
      const cluster = owner?.closest(".panel-cluster.is-managed-rail");
      if (cluster && !event.target.closest("button")) openGenericOwnerFromRail(owner, cluster);
    });

    new MutationObserver(() => ensureManagedRailActions()).observe(linkedWorkspace, {
      childList: true,
      subtree: true,
    });
  }

  const overviewRailHeader = linkedOverviewPanel?.querySelector(".panel-header");
  overviewRailHeader?.addEventListener("click", (event) => {
    if (!linkedOverviewCluster.classList.contains("is-main-collapsed") || event.target.closest("button")) return;
    openOverviewFromRail();
  });
  overviewRailHeader?.addEventListener("keydown", (event) => {
    if (!linkedOverviewCluster.classList.contains("is-main-collapsed") || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    openOverviewFromRail();
  });

  /* Detail en Bewerken gedragen zich als eigenaar + gekoppeld taakpaneel. */
  function linkRailOpening(panel) {
    const header = panel.querySelector(".dependent-header");
    if (!header) return;
    let openPairAfterClick = false;

    header.addEventListener("click", (event) => {
      openPairAfterClick = isCollapsed(panel)
        && !panel.classList.contains("is-disabled")
        && !event.target.closest(".panel-action");
    }, true);

    header.addEventListener("click", () => {
      if (!openPairAfterClick) return;
      openPairAfterClick = false;
      openDetailPair();
    });
  }

  linkRailOpening(linkedDetailPanel);
  linkRailOpening(linkedEditPanel);

  linkedDetailPanel.querySelector(".collapse-dependent")?.addEventListener("click", () => {
    closeDetailPair();
  });

  /* Fullscreen werkt voor een paneel in zowel de linker- als rechtercluster. */
  function setFullscreenButtonState(panel, maximized) {
    const button = panel.querySelector(".maximize-action");
    if (!button) return;
    const groupedFullscreen = document.body.dataset.fullscreenScope === "cluster";
    const label = maximized
      ? "Volledige focus verlaten"
      : groupedFullscreen ? "Paneelgroep maximaliseren" : "Paneel maximaliseren";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(maximized));
    button.title = maximized ? "Herstel paneelindeling" : groupedFullscreen ? "Groep maximaliseren" : "Maximaliseren";
  }

  function captureFullscreenRailState(panelGroup) {
    if (!fullscreenOthersAsRails()) return null;
    return {
      ownerCluster: panelGroup?.id || "",
      overviewCollapsed: linkedOverviewCluster.classList.contains("is-main-collapsed"),
      detailCollapsed: isCollapsed(linkedDetailPanel),
      detailDisabled: linkedDetailPanel.classList.contains("is-disabled"),
      editCollapsed: isCollapsed(linkedEditPanel),
      editDisabled: linkedEditPanel.classList.contains("is-disabled"),
    };
  }

  function applyFullscreenRails(panelGroup) {
    fullscreenRailSnapshot = captureFullscreenRailState(panelGroup);
    if (!fullscreenRailSnapshot) return;

    if (panelGroup === linkedOverviewCluster) {
      setLinkedPanel(linkedDetailPanel, true, fullscreenRailSnapshot.detailDisabled);
      setLinkedPanel(linkedEditPanel, true, fullscreenRailSnapshot.editDisabled);
    } else if (panelGroup === linkedDetailCluster) {
      closeOverviewToRail();
    }
    callWorkspaceStatus();
  }

  function restoreFullscreenRails() {
    const snapshot = fullscreenRailSnapshot;
    fullscreenRailSnapshot = null;
    if (!snapshot) return false;

    if (snapshot.overviewCollapsed) closeOverviewToRail();
    else openOverviewFromRail();
    setLinkedPanel(linkedDetailPanel, snapshot.detailCollapsed, snapshot.detailDisabled);
    setLinkedPanel(linkedEditPanel, snapshot.editCollapsed, snapshot.editDisabled);
    callWorkspaceStatus();
    return true;
  }

  function restoreFullscreen() {
    const maximizedPanel = linkedWorkspace.querySelector(".panel.is-maximized");
    if (!maximizedPanel) return null;
    const action = maximizedPanel.querySelector(".maximize-action");
    const panelGroup = maximizedPanel.closest(".panel-cluster");
    maximizedPanel.classList.remove("is-maximized");
    panelGroup?.classList.remove("has-maximized-child");
    if (panelGroup) delete panelGroup.dataset.fullscreenOwner;
    linkedWorkspace.classList.remove("has-maximized");
    setFullscreenButtonState(maximizedPanel, false);
    if (!restoreFullscreenRails()) callWorkspaceStatus();
    return action;
  }

  function maximizePanel(panel) {
    const alreadyMaximized = panel.classList.contains("is-maximized");
    restoreFullscreen();
    if (alreadyMaximized) return;

    const panelGroup = panel.closest(".panel-cluster");
    panel.classList.add("is-maximized");
    panelGroup?.classList.add("has-maximized-child");
    if (panelGroup) panelGroup.dataset.fullscreenOwner = panel.id || panel.dataset.panel || "owner";
    linkedWorkspace.classList.add("has-maximized");
    setFullscreenButtonState(panel, true);
    applyFullscreenRails(panelGroup);
    linkedModeLabel.textContent = `Volledige focus · ${panelName(panel)}`;
    linkedVisibleLabel.textContent = fullscreenOthersAsRails()
      ? `${panelName(panel)} in volledige focus · andere panelen als rail`
      : "1 paneel in volledige focus";
  }

  fullscreenButtons.forEach((button) => setFullscreenButtonState(button.closest(".panel"), false));
  if (document.body.dataset.panelManagement === "owner-groups") {
    linkedWorkspace.addEventListener("click", (event) => {
      const button = event.target.closest(".maximize-action");
      if (!button) return;
      event.stopPropagation();
      maximizePanel(button.closest(".panel"));
    });
  } else {
    fullscreenButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        maximizePanel(button.closest(".panel"));
      });
    });
  }

  linkedWorkspace.addEventListener("click", (event) => {
    if (!fullscreenOthersAsRails() || !linkedWorkspace.classList.contains("has-maximized")) return;
    const ownerCluster = linkedWorkspace.querySelector(".panel.is-maximized")?.closest(".panel-cluster");
    const targetCluster = event.target.closest(".panel-cluster");
    if (targetCluster && targetCluster !== ownerCluster && event.target.closest(".panel-header")) {
      restoreFullscreen();
    }
  }, true);

  linkedWorkspace.addEventListener("click", (event) => {
    if (!linkedWorkspace.classList.contains("has-maximized")) return;
    const owner = linkedWorkspace.querySelector(".panel.is-maximized");
    const ownerCluster = owner?.closest(".panel-cluster");
    const contextualClose = event.target.closest("#closeFilterButton, .collapse-dependent");
    const actionPanel = contextualClose?.closest(".panel");
    const closesOwnedSubpanel = preserveOwnerFullscreen
      && actionPanel
      && actionPanel !== owner
      && actionPanel.closest(".panel-cluster") === ownerCluster;
    if (closesOwnedSubpanel) return;
    if (contextualClose || event.target.closest(".back-action")) restoreFullscreen();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !linkedWorkspace.classList.contains("has-maximized")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    restoreFullscreen()?.focus();
  }, true);

  /* Schaalgreep tussen de twee hoofdgebieden. */
  function mainDividerMode() {
    if (linkedWorkspace.classList.contains("has-maximized")) return "disabled";
    if (linkedDetailPanel.classList.contains("is-disabled")) return "disabled";
    if (linkedOverviewCluster.classList.contains("is-main-collapsed")) return "open-left";
    return isCollapsed(linkedDetailPanel) ? "open-right" : "resize";
  }

  function rightClusterMinimum() {
    if (classicResizeFeel) {
      const editOpen = !isCollapsed(linkedEditPanel);
      return editOpen ? 232 + 8 + 250 : 232;
    }
    if (document.body.dataset.editPresentation === "subpanel" && isCollapsed(linkedEditPanel)) return 340;
    const configuredRailWidth = Number.parseFloat(document.body.dataset.railWidth);
    const railWidth = Number.isFinite(configuredRailWidth) ? configuredRailWidth : 50;
    return isCollapsed(linkedEditPanel) ? 340 + 8 + railWidth : 688;
  }

  function syncMainDivider() {
    if (!mainDivider) return;
    const mode = mainDividerMode();
    const disabled = mode === "disabled";
    mainDivider.classList.toggle("is-disabled", disabled);
    mainDivider.classList.toggle("is-open-handle", mode.startsWith("open-"));
    mainDivider.setAttribute("aria-disabled", String(disabled));
    mainDivider.tabIndex = disabled ? -1 : 0;
    if (mode === "open-left") {
      mainDivider.setAttribute("aria-label", "Sleep naar rechts om Overzicht te openen");
      mainDivider.title = "Sleep naar rechts om Overzicht te openen";
    } else if (mode === "open-right") {
      mainDivider.setAttribute("aria-label", "Sleep naar links om Detail en Bewerken te openen");
      mainDivider.title = "Sleep naar links om Detail en Bewerken te openen";
    } else if (mode === "resize") {
      mainDivider.setAttribute("aria-label", "Breedte van Overzicht en profielcontext aanpassen");
      mainDivider.title = "Sleep om de twee hoofdgebieden te schalen · dubbelklik voor 50/50";
      const left = linkedOverviewCluster.getBoundingClientRect().width;
      const right = linkedDetailCluster.getBoundingClientRect().width;
      const percentage = Math.round(100 * left / (left + right));
      mainDivider.setAttribute("aria-valuenow", String(percentage));
    } else {
      mainDivider.title = "";
    }
  }

  function overviewClusterMinimum() {
    if (!classicResizeFeel) return 340;
    const filterWidth = linkedFilterPanel && !linkedFilterPanel.hidden
      ? linkedFilterPanel.getBoundingClientRect().width + 8
      : 0;
    return 232 + filterWidth;
  }

  function setClusterShare(share) {
    const currentTotal = linkedOverviewCluster.getBoundingClientRect().width
      + linkedDetailCluster.getBoundingClientRect().width;
    const ratioTotal = classicResizeFeel && currentTotal > 0 ? currentTotal : 2.6;
    linkedOverviewCluster.style.setProperty("--cluster-size", Math.max(.1, ratioTotal * share).toFixed(5));
    linkedDetailCluster.style.setProperty("--cluster-size", Math.max(.1, ratioTotal * (1 - share)).toFixed(5));
    mainDivider.setAttribute("aria-valuenow", String(Math.round(share * 100)));
  }

  function configuredRailWidth() {
    const value = Number.parseFloat(document.body.dataset.railWidth);
    return Number.isFinite(value) ? value : 50;
  }

  function clearMainRailPreview() {
    [linkedOverviewCluster, linkedDetailCluster].forEach((cluster) => {
      cluster.classList.remove("is-continuous-rail-drag");
      cluster.style.removeProperty("--continuous-rail-size");
    });
  }

  function setMainRailPreview(side, width) {
    const cluster = side === "left" ? linkedOverviewCluster : linkedDetailCluster;
    const other = side === "left" ? linkedDetailCluster : linkedOverviewCluster;
    other.classList.remove("is-continuous-rail-drag");
    other.style.removeProperty("--continuous-rail-size");
    cluster.classList.add("is-continuous-rail-drag");
    cluster.style.setProperty("--continuous-rail-size", `${Math.round(width)}px`);
  }

  function switchResizeToRail(side, pointerX) {
    if (!mainDrag) return;
    const startSize = side === "left" ? mainDrag.leftMinimum : mainDrag.rightMinimum;
    setMainRailPreview(side, startSize);
    if (side === "left") closeOverviewToRail();
    else closeDetailPair();
    mainDrag.mode = side === "left" ? "rail-left" : "rail-right";
    mainDrag.startX = pointerX;
    mainDrag.railStartSize = startSize;
    mainDivider.classList.add("is-collapse-pending");
  }

  function switchRailToResize(side, pointerX) {
    if (!mainDrag) return;
    const totalWidth = mainDrag.totalWidth;
    const leftMinimum = Math.min(overviewClusterMinimum(), totalWidth - configuredRailWidth());
    const rightMinimum = Math.min(rightClusterMinimum(), totalWidth - configuredRailWidth());
    const nextLeft = side === "left"
      ? Math.min(leftMinimum, totalWidth - rightMinimum)
      : Math.max(leftMinimum, totalWidth - rightMinimum);

    clearMainRailPreview();
    if (side === "left") openOverviewFromRail();
    else openDetailPair();
    setClusterShare(nextLeft / totalWidth);

    mainDrag.mode = "resize";
    mainDrag.startX = pointerX;
    mainDrag.leftWidth = nextLeft;
    mainDrag.rightWidth = totalWidth - nextLeft;
    mainDrag.leftMinimum = Math.min(overviewClusterMinimum(), nextLeft);
    mainDrag.rightMinimum = Math.min(rightClusterMinimum(), totalWidth - nextLeft);
    mainDivider.classList.remove("is-collapse-pending");
  }

  function applyRailResize(pointerX) {
    if (!mainDrag) return;
    const side = mainDrag.mode === "rail-left" ? "left" : "right";
    const direction = side === "left" ? 1 : -1;
    const requested = mainDrag.railStartSize + direction * (pointerX - mainDrag.startX);
    const expandedMinimum = side === "left" ? mainDrag.leftMinimum : mainDrag.rightMinimum;
    const nextSize = Math.min(Math.max(requested, configuredRailWidth()), expandedMinimum);
    setMainRailPreview(side, nextSize);
    mainDivider.classList.toggle("is-collapse-pending", nextSize < expandedMinimum);
    if (requested >= expandedMinimum) switchRailToResize(side, pointerX);
  }

  function applyMainResize(delta, allowCollapse = true, pointerX = null) {
    if (!mainDrag) return;
    const rawLeft = mainDrag.leftWidth + delta;
    const rawRight = mainDrag.rightWidth - delta;
    const collapseOvershoot = classicResizeFeel ? 36 : 56;
    const overviewCanCollapse = document.body.dataset.mainRails === "both";
    if (allowCollapse && overviewCanCollapse && rawLeft < mainDrag.leftMinimum - collapseOvershoot) {
      if (continuousMainResizeEnabled() && Number.isFinite(pointerX)) {
        switchResizeToRail("left", pointerX);
        return;
      }
      stopMainDrag();
      closeOverviewToRail();
      return;
    }
    if (allowCollapse && rawRight < mainDrag.rightMinimum - collapseOvershoot) {
      if (continuousMainResizeEnabled() && Number.isFinite(pointerX)) {
        switchResizeToRail("right", pointerX);
        return;
      }
      stopMainDrag();
      linkedDetailPanel.querySelector(".collapse-dependent")?.click();
      return;
    }
    const lowerBound = classicResizeFeel
      ? mainDrag.leftMinimum
      : Math.min(mainDrag.leftMinimum, mainDrag.totalWidth - mainDrag.rightMinimum);
    const upperBound = classicResizeFeel
      ? mainDrag.totalWidth - mainDrag.rightMinimum
      : Math.max(mainDrag.leftMinimum, mainDrag.totalWidth - mainDrag.rightMinimum);
    const nextLeft = Math.min(Math.max(rawLeft, lowerBound), upperBound);
    setClusterShare(nextLeft / mainDrag.totalWidth);
  }

  function stopMainDrag() {
    if (!mainDrag) return;
    if (mainDivider.hasPointerCapture?.(mainDrag.pointerId)) mainDivider.releasePointerCapture(mainDrag.pointerId);
    mainDivider.classList.remove("is-resizing", "is-collapse-pending");
    linkedWorkspace.classList.remove("is-main-resizing");
    clearMainRailPreview();
    mainDrag = null;
    requestAnimationFrame(syncMainDivider);
  }

  if (mainDivider) {
    mainDivider.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || mainDividerMode() === "disabled") return;
      event.preventDefault();
      mainDivider.setPointerCapture(event.pointerId);
      mainDivider.classList.add("is-resizing");
      linkedWorkspace.classList.add("is-main-resizing");
      const leftWidth = linkedOverviewCluster.getBoundingClientRect().width;
      const rightWidth = linkedDetailCluster.getBoundingClientRect().width;
      const totalWidth = leftWidth + rightWidth;
      const dividerMode = mainDividerMode();
      const dragMode = continuousMainResizeEnabled()
        ? dividerMode.replace("open-left", "rail-left").replace("open-right", "rail-right")
        : dividerMode;
      const leftTargetMinimum = overviewClusterMinimum();
      const rightTargetMinimum = rightClusterMinimum();
      mainDrag = {
        pointerId: event.pointerId,
        mode: dragMode,
        startX: event.clientX,
        leftWidth,
        rightWidth,
        totalWidth,
        leftMinimum: dragMode === "rail-left"
          ? Math.min(leftTargetMinimum, totalWidth - configuredRailWidth())
          : Math.min(leftTargetMinimum, leftWidth),
        rightMinimum: dragMode === "rail-right"
          ? Math.min(rightTargetMinimum, totalWidth - configuredRailWidth())
          : Math.min(rightTargetMinimum, rightWidth),
        railStartSize: dragMode === "rail-left" ? leftWidth : rightWidth
      };
      if (dragMode === "rail-left") setMainRailPreview("left", leftWidth);
      if (dragMode === "rail-right") setMainRailPreview("right", rightWidth);
    });

    mainDivider.addEventListener("pointermove", (event) => {
      if (!mainDrag || mainDrag.pointerId !== event.pointerId) return;
      const delta = event.clientX - mainDrag.startX;
      if (continuousMainResizeEnabled() && ["rail-left", "rail-right"].includes(mainDrag.mode)) {
        applyRailResize(event.clientX);
        return;
      }
      if (mainDrag.mode === "open-left") {
        if (delta >= 16) {
          stopMainDrag();
          openOverviewFromRail();
        }
        return;
      }
      if (mainDrag.mode === "open-right") {
        if (delta <= -16) {
          stopMainDrag();
          openDetailPair();
        }
        return;
      }
      mainDivider.classList.toggle(
        "is-collapse-pending",
        mainDrag.leftWidth + delta < mainDrag.leftMinimum || mainDrag.rightWidth - delta < mainDrag.rightMinimum
      );
      applyMainResize(delta, true, event.clientX);
    });

    mainDivider.addEventListener("pointerup", stopMainDrag);
    mainDivider.addEventListener("pointercancel", stopMainDrag);
    mainDivider.addEventListener("dblclick", () => {
      const mode = mainDividerMode();
      if (mode === "open-left") return openOverviewFromRail();
      if (mode === "open-right") return openDetailPair();
      if (mode === "resize") setClusterShare(.5);
    });
    mainDivider.addEventListener("keydown", (event) => {
      const mode = mainDividerMode();
      if (mode === "open-left" && ["ArrowRight", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openOverviewFromRail();
        return;
      }
      if (mode === "open-right" && ["ArrowLeft", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openDetailPair();
        return;
      }
      if (mode !== "resize" || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const leftWidth = linkedOverviewCluster.getBoundingClientRect().width;
      const rightWidth = linkedDetailCluster.getBoundingClientRect().width;
      mainDrag = {
        pointerId: -1,
        leftWidth,
        rightWidth,
        totalWidth: leftWidth + rightWidth,
        leftMinimum: Math.min(overviewClusterMinimum(), leftWidth),
        rightMinimum: Math.min(rightClusterMinimum(), rightWidth)
      };
      applyMainResize((event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 64 : 24), false);
      mainDrag = null;
    });
  }

  /* Schaalgreep van het blauwe taakpaneel binnen Detail. */
  function editDividerMode() {
    if (linkedWorkspace.classList.contains("has-maximized") || linkedEditPanel.classList.contains("is-disabled")) return "disabled";
    return isCollapsed(linkedEditPanel) ? "open" : "resize";
  }

  function editWidthLimits() {
    const available = linkedDetailCluster.getBoundingClientRect().width - 348;
    return { minimum: 290, maximum: Math.max(290, Math.min(520, available)) };
  }

  function setEditWidth(width) {
    const limits = editWidthLimits();
    const next = Math.min(Math.max(width, limits.minimum), limits.maximum);
    linkedEditPanel.style.setProperty("--edit-width", `${Math.round(next)}px`);
    editDivider.setAttribute("aria-valuenow", String(Math.round(next)));
  }

  function syncEditDivider() {
    if (!editDivider) return;
    const mode = editDividerMode();
    const disabled = mode === "disabled";
    editDivider.classList.toggle("is-disabled", disabled);
    editDivider.classList.toggle("is-open-handle", mode === "open");
    editDivider.setAttribute("aria-disabled", String(disabled));
    editDivider.tabIndex = disabled ? -1 : 0;
    if (mode === "open") {
      editDivider.setAttribute("aria-label", "Sleep naar links om Bewerken te openen");
      editDivider.title = "Sleep naar links om Bewerken te openen";
    } else if (mode === "resize") {
      editDivider.setAttribute("aria-label", "Breedte van het bewerkingspaneel aanpassen");
      editDivider.title = "Sleep om het bewerkingspaneel te schalen";
      editDivider.setAttribute("aria-valuenow", String(Math.round(linkedEditPanel.getBoundingClientRect().width)));
    } else {
      editDivider.title = "";
    }
  }

  function stopEditDrag() {
    if (!editDrag) return;
    if (editDivider.hasPointerCapture?.(editDrag.pointerId)) editDivider.releasePointerCapture(editDrag.pointerId);
    editDivider.classList.remove("is-resizing", "is-collapse-pending");
    linkedWorkspace.classList.remove("is-edit-resizing");
    editDrag = null;
    requestAnimationFrame(syncEditDivider);
  }

  if (editDivider) {
    editDivider.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || editDividerMode() === "disabled") return;
      event.preventDefault();
      editDivider.setPointerCapture(event.pointerId);
      editDivider.classList.add("is-resizing");
      linkedWorkspace.classList.add("is-edit-resizing");
      editDrag = {
        pointerId: event.pointerId,
        mode: editDividerMode(),
        startX: event.clientX,
        startWidth: linkedEditPanel.getBoundingClientRect().width
      };
    });

    editDivider.addEventListener("pointermove", (event) => {
      if (!editDrag || editDrag.pointerId !== event.pointerId) return;
      const delta = event.clientX - editDrag.startX;
      if (editDrag.mode === "open") {
        if (delta <= -16) {
          stopEditDrag();
          openDetailPair();
        }
        return;
      }

      const requestedWidth = editDrag.startWidth - delta;
      const minimum = editWidthLimits().minimum;
      editDivider.classList.toggle("is-collapse-pending", requestedWidth < minimum);
      if (requestedWidth < minimum - 32) {
        stopEditDrag();
        linkedEditPanel.querySelector(".collapse-dependent")?.click();
        return;
      }
      setEditWidth(requestedWidth);
    });

    editDivider.addEventListener("pointerup", stopEditDrag);
    editDivider.addEventListener("pointercancel", stopEditDrag);
    editDivider.addEventListener("dblclick", () => {
      if (editDividerMode() === "open") openDetailPair();
      else if (editDividerMode() === "resize") setEditWidth(350);
    });
    editDivider.addEventListener("keydown", (event) => {
      const mode = editDividerMode();
      if (mode === "open" && ["ArrowLeft", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openDetailPair();
        return;
      }
      if (mode !== "resize" || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const current = linkedEditPanel.getBoundingClientRect().width;
      setEditWidth(current + (event.key === "ArrowLeft" ? 20 : -20));
    });
  }

  const linkedObserver = new MutationObserver(() => {
    if (linkedOverviewCluster.classList.contains("is-main-collapsed") && isCollapsed(linkedDetailPanel)) {
      openOverviewFromRail();
      return;
    }
    syncMainDivider();
    syncEditDivider();
    updateLinkedStatus();
  });
  [linkedWorkspace, linkedOverviewCluster, linkedFilterPanel, linkedDetailPanel, linkedEditPanel].forEach((item) => {
    if (item) linkedObserver.observe(item, { attributes: true, attributeFilter: ["class", "hidden"] });
  });

  window.addEventListener("resize", () => {
    syncMainDivider();
    syncEditDivider();
  });

  const initialProfile = document.body.dataset.initialProfile;
  if (initialProfile) document.querySelector(`.profile-row[data-profile-id="${initialProfile}"]`)?.click();
  syncMainDivider();
  syncEditDivider();
  updateLinkedStatus();
})();
