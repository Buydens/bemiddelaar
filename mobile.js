const workspace = document.querySelector("#mobileWorkspace");
const tabs = [...document.querySelectorAll(".panel-tab")];
const panels = [...document.querySelectorAll(".mobile-panel")];
const dots = [...document.querySelectorAll(".page-dots i")];
const dotGroup = document.querySelector(".page-dots");

const scrollPositions = new Map();
let activePanelId = "overview";
let swipeStart = null;

function panelIndex(panelId) {
  return tabs.findIndex((tab) => tab.dataset.panel === panelId);
}

function updateDots(index) {
  dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
  dotGroup.setAttribute("aria-label", `Paneel ${index + 1} van ${tabs.length}`);
}

function activatePanel(panelId, direction = "forward") {
  if (panelId === activePanelId) return;

  const currentPanel = panels.find((panel) => panel.dataset.panel === activePanelId);
  const currentScroll = currentPanel?.querySelector(".mobile-panel-scroll");
  if (currentScroll) scrollPositions.set(activePanelId, currentScroll.scrollTop);

  const nextPanel = panels.find((panel) => panel.dataset.panel === panelId);
  const nextTab = tabs.find((tab) => tab.dataset.panel === panelId);
  if (!nextPanel || !nextTab) return;

  panels.forEach((panel) => {
    const isActive = panel === nextPanel;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
    panel.classList.remove("enter-from-left", "enter-from-right");
  });

  tabs.forEach((tab) => {
    const isActive = tab === nextTab;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  nextPanel.classList.add(direction === "backward" ? "enter-from-left" : "enter-from-right");
  activePanelId = panelId;

  const nextScroll = nextPanel.querySelector(".mobile-panel-scroll");
  nextScroll.scrollTop = scrollPositions.get(panelId) || 0;
  updateDots(panelIndex(panelId));
}

function adjacentPanel(direction) {
  const currentIndex = panelIndex(activePanelId);
  const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
  return tabs[nextIndex].dataset.panel;
}

tabs.forEach((tab, index) => {
  tab.tabIndex = index === 0 ? 0 : -1;
  tab.addEventListener("click", () => {
    const direction = panelIndex(tab.dataset.panel) < panelIndex(activePanelId) ? "backward" : "forward";
    activatePanel(tab.dataset.panel, direction);
  });
});

document.querySelector(".panel-tabs").addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const nextId = adjacentPanel(direction);
  activatePanel(nextId, direction < 0 ? "backward" : "forward");
  tabs[panelIndex(nextId)].focus();
});

workspace.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  swipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
});

workspace.addEventListener("pointerup", (event) => {
  if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;
  const deltaX = event.clientX - swipeStart.x;
  const deltaY = event.clientY - swipeStart.y;
  swipeStart = null;

  if (Math.abs(deltaX) < 58 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
  const direction = deltaX < 0 ? 1 : -1;
  activatePanel(adjacentPanel(direction), direction < 0 ? "backward" : "forward");
});

workspace.addEventListener("pointercancel", () => {
  swipeStart = null;
});
