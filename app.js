const workspace = document.querySelector("#workspace");
const addPanelButton = document.querySelector("#addPanelButton");
const layoutButton = document.querySelector("#layoutButton");
const layoutMenu = document.querySelector("#layoutMenu");
const panelCount = document.querySelector("#panelCount");
const viewportState = document.querySelector("#viewportState");

const panelNames = ["Notities", "Historiek", "Vergelijking", "Details", "Bronnen"];
const autoCollapseOvershoot = 36;
let panelSequence = 3;
let draggedPanel = null;

function panels() {
  return [...workspace.querySelectorAll(".panel")];
}

function preserveCurrentPanelRatios() {
  const flexiblePanels = panels().filter(
    (panel) => !panel.classList.contains("is-collapsed") && !panel.classList.contains("is-maximized"),
  );
  const widths = flexiblePanels.map((panel) => panel.getBoundingClientRect().width);

  flexiblePanels.forEach((panel, index) => {
    panel.style.setProperty("--panel-size", widths[index].toFixed(3));
  });
}

function createGridLabels(panel) {
  const labelContainer = panel.querySelector(".grid-labels");
  if (!labelContainer || labelContainer.children.length) return;

  for (let index = 1; index <= 12; index += 1) {
    const label = document.createElement("span");
    label.textContent = String(index).padStart(2, "0");
    labelContainer.append(label);
  }
}

function updateAdaptiveGrid(panel) {
  const width = panel.getBoundingClientRect().width;
  const columns = width >= 840 ? 12 : width >= 480 ? 8 : 4;
  if (panel.dataset.columns === String(columns)) return;

  panel.dataset.columns = String(columns);
  const columnLabel = panel.querySelector(".grid-note span");
  if (columnLabel) columnLabel.textContent = `${columns} kolommen`;
}

const gridResizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => updateAdaptiveGrid(entry.target));
});

function observePanelGrid(panel) {
  createGridLabels(panel);
  gridResizeObserver.observe(panel);
  updateAdaptiveGrid(panel);
}

function updatePanelStatus() {
  const currentPanels = panels();
  const collapsedCount = currentPanels.filter((panel) => panel.classList.contains("is-collapsed")).length;
  const openCount = currentPanels.length - collapsedCount;

  if (collapsedCount === 0) {
    panelCount.textContent = `${openCount} ${openCount === 1 ? "paneel" : "panelen"} open`;
  } else if (openCount === 0) {
    panelCount.textContent = "Alle panelen ingeklapt";
  } else {
    panelCount.textContent = `${openCount} open · ${collapsedCount} ingeklapt`;
  }
}

function updatePanelMeta() {
  const currentPanels = panels();
  currentPanels.forEach((panel, index) => {
    panel.querySelector(".panel-index").textContent = String(index + 1).padStart(2, "0");
    observePanelGrid(panel);
  });
  updatePanelStatus();
  addPanelButton.disabled = currentPanels.length >= 5;
  addPanelButton.title = currentPanels.length >= 5 ? "Maximum van 5 panelen bereikt" : "Paneel toevoegen";
}

function syncResizers() {
  workspace.querySelectorAll(".resizer").forEach((resizer) => resizer.remove());
  const currentPanels = panels();
  currentPanels.slice(0, -1).forEach((panel) => {
    const resizer = document.createElement("div");
    resizer.className = "resizer";
    resizer.setAttribute("role", "separator");
    resizer.setAttribute("aria-orientation", "vertical");
    resizer.setAttribute("aria-label", "Paneelbreedte aanpassen");
    resizer.tabIndex = 0;
    panel.after(resizer);
  });
}

function setActive(panel) {
  panels().forEach((item) => item.classList.toggle("is-active", item === panel));
}

function setMaximizeAccessibility(panel, maximized) {
  const action = panel.querySelector(".maximize-action");
  action.setAttribute("aria-label", maximized ? "Volledige focus verlaten" : "Paneel maximaliseren");
  action.title = maximized ? "Volledige focus verlaten" : "Maximaliseren";
}

function restoreFromMaximize() {
  const maximized = workspace.querySelector(".panel.is-maximized");
  if (maximized) {
    maximized.classList.remove("is-maximized");
    setMaximizeAccessibility(maximized, false);
  }
  workspace.classList.remove("has-maximized");
}

function toggleMaximize(panel) {
  const willMaximize = !panel.classList.contains("is-maximized");
  restoreFromMaximize();
  if (willMaximize) {
    panel.classList.remove("is-collapsed");
    setCollapsedAccessibility(panel, false);
    updatePanelStatus();
    panel.classList.add("is-maximized");
    setMaximizeAccessibility(panel, true);
    workspace.classList.add("has-maximized");
  }
}

function setCollapsedAccessibility(panel, collapsed) {
  const header = panel.querySelector(".panel-header");
  if (collapsed) {
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", "false");
    header.setAttribute("aria-label", `${panel.dataset.panelTitle} opnieuw openen`);
  } else {
    header.removeAttribute("role");
    header.removeAttribute("tabindex");
    header.removeAttribute("aria-expanded");
    header.removeAttribute("aria-label");
  }
}

function toggleCollapse(panel) {
  if (panel.classList.contains("is-maximized")) restoreFromMaximize();
  const collapsed = panel.classList.toggle("is-collapsed");
  setCollapsedAccessibility(panel, collapsed);
  updatePanelStatus();
}

function createPanel() {
  if (panels().length >= 5) {
    return;
  }

  restoreFromMaximize();
  panelSequence += 1;
  const title = panelNames[(panelSequence - 4) % panelNames.length];
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.dataset.panelId = String(panelSequence);
  panel.dataset.panelTitle = title;
  panel.style.setProperty("--panel-size", "1");
  panel.innerHTML = `
    <header class="panel-header" draggable="true">
      <div class="panel-identity">
        <span class="panel-index"></span>
        <span class="panel-rail-icon" aria-hidden="true">
          <svg viewBox="0 0 18 18"><path d="M5 2.75h5l3 3v9.5H5z" /><path d="M10 2.75v3h3" /></svg>
        </span>
        <span class="panel-title">${title}</span>
      </div>
      <div class="panel-controls">
        <button class="panel-action maximize-action" type="button" aria-label="Paneel maximaliseren" title="Maximaliseren">
          <svg class="maximize-icon" aria-hidden="true" viewBox="0 0 18 18"><path d="M5 2.75H2.75V5M13 2.75h2.25V5M5 15.25H2.75V13M13 15.25h2.25V13" /></svg>
          <svg class="restore-icon" aria-hidden="true" viewBox="0 0 18 18"><path d="M2.75 6H6V2.75M15.25 6H12V2.75M2.75 12H6v3.25M15.25 12H12v3.25" /></svg>
        </button>
        <button class="panel-action close-action" type="button" aria-label="Paneel sluiten naar rail" title="Sluiten naar rail">
          <svg aria-hidden="true" viewBox="0 0 18 18"><path d="m5.5 5.5 7 7M12.5 5.5l-7 7" /></svg>
        </button>
      </div>
    </header>
    <div class="panel-body">
      <div class="grid-stage">
        <div class="grid-labels" aria-hidden="true"></div>
        <div class="grid-canvas">
          <div class="grid-note">
            <span>12 kolommen</span>
            <small>Nieuw flexibel werkvlak</small>
          </div>
          <div class="grid-example example-overview" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>`;

  workspace.append(panel);
  syncResizers();
  updatePanelMeta();
  setActive(panel);
  panel.scrollIntoView({ behavior: "smooth", inline: "end", block: "nearest" });
}

function applyLayout(layout) {
  const currentPanels = panels();
  if (!currentPanels.length) return;

  restoreFromMaximize();
  currentPanels.forEach((panel) => {
    panel.classList.remove("is-collapsed");
    setCollapsedAccessibility(panel, false);
  });
  updatePanelStatus();
  const sizes = {
    equal: currentPanels.map(() => 1),
    focus: currentPanels.map((_, index) => (index === Math.floor(currentPanels.length / 2) ? 1.8 : 0.8)),
    context: currentPanels.map((_, index) => (index === currentPanels.length - 1 ? 1.65 : 0.8)),
  }[layout];

  currentPanels.forEach((panel, index) => {
    panel.style.setProperty("--panel-size", sizes[index]);
  });
  layoutMenu.hidden = true;
  layoutButton.setAttribute("aria-expanded", "false");
}

function beginRailExpansion(event, resizer, leftPanel, rightPanel) {
  event.preventDefault();
  const startX = event.clientX;
  const leftCollapsed = leftPanel.classList.contains("is-collapsed");
  const rightCollapsed = rightPanel.classList.contains("is-collapsed");
  const expandedMinimum = 232;
  let move;

  const clearRailPreview = () => {
    [leftPanel, rightPanel].forEach((panel) => {
      panel.classList.remove("is-rail-dragging");
      panel.style.removeProperty("--rail-drag-size");
    });
  };

  const end = () => {
    clearRailPreview();
    resizer.classList.remove("is-resizing");
    document.body.classList.remove("is-resizing");
    if (resizer.hasPointerCapture?.(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  };

  move = (moveEvent) => {
    const delta = moveEvent.clientX - startX;
    const panel = delta > 0 && leftCollapsed ? leftPanel : delta < 0 && rightCollapsed ? rightPanel : null;
    const otherPanel = panel === leftPanel ? rightPanel : leftPanel;

    if (!panel) {
      clearRailPreview();
      return;
    }

    otherPanel.classList.remove("is-rail-dragging");
    otherPanel.style.removeProperty("--rail-drag-size");
    const baseRailWidth = Number.parseFloat(getComputedStyle(panel).minWidth) || 50;
    const requestedWidth = Math.min(expandedMinimum, baseRailWidth + Math.abs(delta));
    panel.classList.add("is-rail-dragging");
    panel.style.setProperty("--rail-drag-size", `${requestedWidth}px`);

    if (requestedWidth >= expandedMinimum) {
      panel.style.setProperty("--panel-size", expandedMinimum.toFixed(3));
      end();
      setActive(panel);
      toggleCollapse(panel);
    }
  };

  resizer.classList.add("is-resizing");
  document.body.classList.add("is-resizing");
  resizer.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
  window.addEventListener("pointercancel", end, { once: true });
}

function beginResize(event, resizer) {
  if (event.type === "pointerdown" && event.button !== 0) return;
  const leftPanel = resizer.previousElementSibling;
  const rightPanel = resizer.nextElementSibling;
  if (!leftPanel?.classList.contains("panel") || !rightPanel?.classList.contains("panel")) return;
  if (leftPanel.classList.contains("is-collapsed") || rightPanel.classList.contains("is-collapsed")) {
    beginRailExpansion(event, resizer, leftPanel, rightPanel);
    return;
  }

  event.preventDefault();
  const startX = event.clientX;
  const leftWidth = leftPanel.getBoundingClientRect().width;
  const rightWidth = rightPanel.getBoundingClientRect().width;
  const totalWidth = leftWidth + rightWidth;
  const leftMinimum = Number.parseFloat(getComputedStyle(leftPanel).minWidth) || 232;
  const rightMinimum = Number.parseFloat(getComputedStyle(rightPanel).minWidth) || 232;

  resizer.classList.add("is-resizing");
  document.body.classList.add("is-resizing");
  preserveCurrentPanelRatios();
  resizer.setPointerCapture?.(event.pointerId);

  let move;

  const end = () => {
    leftPanel.classList.remove("is-collapse-pending");
    rightPanel.classList.remove("is-collapse-pending");
    resizer.classList.remove("is-resizing");
    document.body.classList.remove("is-resizing");
    if (resizer.hasPointerCapture?.(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  };

  const collapseFromResize = (panel) => {
    leftPanel.style.setProperty("--panel-size", leftWidth.toFixed(3));
    rightPanel.style.setProperty("--panel-size", rightWidth.toFixed(3));
    end();
    setActive(panel);
    toggleCollapse(panel);
  };

  move = (moveEvent) => {
    const delta = moveEvent.clientX - startX;
    const requestedLeft = leftWidth + delta;
    const requestedRight = totalWidth - requestedLeft;

    leftPanel.classList.toggle("is-collapse-pending", requestedLeft < leftMinimum);
    rightPanel.classList.toggle("is-collapse-pending", requestedRight < rightMinimum);

    if (requestedLeft <= leftMinimum - autoCollapseOvershoot) {
      collapseFromResize(leftPanel);
      return;
    }
    if (requestedRight <= rightMinimum - autoCollapseOvershoot) {
      collapseFromResize(rightPanel);
      return;
    }

    const nextLeft = Math.max(leftMinimum, Math.min(totalWidth - rightMinimum, requestedLeft));
    const nextRight = totalWidth - nextLeft;
    leftPanel.style.setProperty("--panel-size", nextLeft.toFixed(3));
    rightPanel.style.setProperty("--panel-size", nextRight.toFixed(3));
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
  window.addEventListener("pointercancel", end, { once: true });
}

workspace.addEventListener("click", (event) => {
  const panel = event.target.closest(".panel");
  if (!panel) return;
  setActive(panel);

  if (panel.classList.contains("is-collapsed")) {
    toggleCollapse(panel);
    return;
  }

  if (event.target.closest(".maximize-action")) toggleMaximize(panel);
  if (event.target.closest(".close-action")) toggleCollapse(panel);
});

workspace.addEventListener("dblclick", (event) => {
  const collapsedPanel = event.target.closest(".panel.is-collapsed");
  if (collapsedPanel) toggleCollapse(collapsedPanel);
  const resizer = event.target.closest(".resizer");
  if (resizer) applyLayout("equal");
});

workspace.addEventListener("pointerdown", (event) => {
  const resizer = event.target.closest(".resizer");
  if (resizer) beginResize(event, resizer);
});

workspace.addEventListener("keydown", (event) => {
  const collapsedHeader = event.target.closest(".panel.is-collapsed .panel-header");
  if (collapsedHeader && ["Enter", " "].includes(event.key)) {
    event.preventDefault();
    toggleCollapse(collapsedHeader.closest(".panel"));
    return;
  }

  const resizer = event.target.closest(".resizer");
  if (!resizer || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const leftPanel = resizer.previousElementSibling;
  const rightPanel = resizer.nextElementSibling;
  const leftCollapsed = leftPanel.classList.contains("is-collapsed");
  const rightCollapsed = rightPanel.classList.contains("is-collapsed");

  if (leftCollapsed || rightCollapsed) {
    const panelToOpen = event.key === "ArrowRight" && leftCollapsed
      ? leftPanel
      : event.key === "ArrowLeft" && rightCollapsed
        ? rightPanel
        : null;
    if (panelToOpen) {
      panelToOpen.style.setProperty("--panel-size", "232");
      setActive(panelToOpen);
      toggleCollapse(panelToOpen);
    }
    return;
  }

  const step = event.shiftKey ? 48 : 16;
  const direction = event.key === "ArrowLeft" ? -1 : 1;
  const leftWidth = leftPanel.getBoundingClientRect().width;
  const rightWidth = rightPanel.getBoundingClientRect().width;
  const leftMinimum = Number.parseFloat(getComputedStyle(leftPanel).minWidth) || 232;
  const rightMinimum = Number.parseFloat(getComputedStyle(rightPanel).minWidth) || 232;
  if (leftWidth + direction * step < leftMinimum) {
    setActive(leftPanel);
    toggleCollapse(leftPanel);
    return;
  }
  if (rightWidth - direction * step < rightMinimum) {
    setActive(rightPanel);
    toggleCollapse(rightPanel);
    return;
  }
  preserveCurrentPanelRatios();
  leftPanel.style.setProperty("--panel-size", (leftWidth + direction * step).toFixed(3));
  rightPanel.style.setProperty("--panel-size", (rightWidth - direction * step).toFixed(3));
});

workspace.addEventListener("dragstart", (event) => {
  const header = event.target.closest(".panel-header");
  if (!header) return;
  draggedPanel = header.closest(".panel");
  draggedPanel.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
});

workspace.addEventListener("dragover", (event) => {
  const target = event.target.closest(".panel");
  if (!draggedPanel || !target || target === draggedPanel) return;
  event.preventDefault();
  panels().forEach((panel) => panel.classList.remove("is-drag-target"));
  target.classList.add("is-drag-target");
});

workspace.addEventListener("drop", (event) => {
  const target = event.target.closest(".panel");
  if (!draggedPanel || !target || target === draggedPanel) return;
  event.preventDefault();
  const targetRect = target.getBoundingClientRect();
  const placeAfter = event.clientX > targetRect.left + targetRect.width / 2;
  target[placeAfter ? "after" : "before"](draggedPanel);
  syncResizers();
  updatePanelMeta();
});

workspace.addEventListener("dragend", () => {
  panels().forEach((panel) => panel.classList.remove("is-dragging", "is-drag-target"));
  draggedPanel = null;
});

addPanelButton.addEventListener("click", createPanel);

layoutButton.addEventListener("click", () => {
  const isOpen = !layoutMenu.hidden;
  layoutMenu.hidden = isOpen;
  layoutButton.setAttribute("aria-expanded", String(!isOpen));
});

layoutMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-layout]");
  if (option) applyLayout(option.dataset.layout);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".layout-picker")) {
    layoutMenu.hidden = true;
    layoutButton.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    layoutMenu.hidden = true;
    layoutButton.setAttribute("aria-expanded", "false");
    restoreFromMaximize();
  }
  if (event.altKey && ["1", "2", "3"].includes(event.key)) {
    event.preventDefault();
    applyLayout({ 1: "equal", 2: "focus", 3: "context" }[event.key]);
  }
});

function updateViewportState() {
  viewportState.textContent = window.innerWidth <= 520 ? "Mobiel" : window.innerWidth <= 850 ? "Compact" : "Desktop";
}

window.addEventListener("resize", updateViewportState);
syncResizers();
updatePanelMeta();
updateViewportState();
