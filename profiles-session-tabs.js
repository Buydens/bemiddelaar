(() => {
  const sessionButton = document.querySelector("#sessionButton");
  const sessionPanel = document.querySelector("#sessionPanel");
  const sessionTabs = document.querySelector(".session-tabs-list");
  const workSessionTabs = document.querySelector("#workSessionTabs");
  const newSessionButton = document.querySelector("#newWorkSessionButton");

  if (!sessionButton || !sessionPanel || !sessionTabs || !workSessionTabs || !newSessionButton) return;

  let sessionCount = workSessionTabs.querySelectorAll('[role="tab"]').length;

  function allTabs() {
    return [...sessionTabs.querySelectorAll('[role="tab"]')];
  }

  function closeSwitcher() {
    if (sessionButton.getAttribute("aria-expanded") !== "true") return;
    sessionButton.click();
    sessionButton.focus();
  }

  function activateTab(tab, closeAfterSelection = true) {
    allTabs().forEach((candidate) => {
      const active = candidate === tab;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-selected", String(active));
      candidate.tabIndex = active ? 0 : -1;
    });
    tab.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (closeAfterSelection) window.setTimeout(closeSwitcher, 120);
  }

  sessionTabs.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) activateTab(tab);
  });

  sessionTabs.addEventListener("keydown", (event) => {
    const current = event.target.closest('[role="tab"]');
    if (!current || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabs = allTabs();
    const currentIndex = tabs.indexOf(current);
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    tabs[nextIndex].focus();
  });

  newSessionButton.addEventListener("click", () => {
    sessionCount += 1;
    const tab = document.createElement("button");
    tab.className = "work-session-tab";
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "workspace");
    tab.setAttribute("aria-selected", "false");
    tab.tabIndex = -1;
    tab.dataset.sessionId = `new-${sessionCount}`;
    tab.innerHTML = `<span class="session-state-dot" aria-hidden="true"></span><span>Werksessie ${sessionCount}</span>`;
    workSessionTabs.append(tab);
    activateTab(tab);
  });
})();
