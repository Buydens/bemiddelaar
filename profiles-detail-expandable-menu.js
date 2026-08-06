// De tabel wordt bij elke filterwijziging opnieuw opgebouwd; daarom luisteren we
// in de capturefase op document in plaats van op de scrollcontainer zelf.
document.addEventListener("scroll", (event) => {
  const container = event.target;
  if (!(container instanceof HTMLElement)) return;
  if (!container.classList.contains("profile-table-scroll")) return;
  container.classList.toggle("is-scrolled-x", container.scrollLeft > 0);
}, true);

(() => {
  const body = document.body;
  const menu = document.querySelector("#detailMenuPanel");
  if (!menu) return;

  const storageKey = "werkruimte-detail-menu-mode";
  const validModes = new Set(["icons", "labels"]);

  const toggle = document.createElement("button");
  toggle.className = "detail-menu-toggle";
  toggle.type = "button";
  toggle.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 18 18">
      <path d="m7 4 5 5-5 5" />
    </svg>
    <span class="detail-menu-label">Navigatie</span>
  `;

  const separator = document.createElement("span");
  separator.className = "detail-icon-menu-separator";
  separator.setAttribute("aria-hidden", "true");
  menu.prepend(separator);
  menu.prepend(toggle);

  menu.querySelectorAll("[data-detail-view]").forEach((button) => {
    const label = document.createElement("span");
    label.className = "detail-menu-label";
    label.textContent = button.getAttribute("aria-label") || button.title;
    button.append(label);
  });

  function storedMode() {
    try {
      const value = localStorage.getItem(storageKey);
      return validModes.has(value) ? value : null;
    } catch {
      return null;
    }
  }

  function saveMode(mode) {
    try {
      localStorage.setItem(storageKey, mode);
    } catch {
      // De demo blijft bruikbaar wanneer opslag door de browser geblokkeerd is.
    }
  }

  function applyMode(mode, persist = true) {
    const nextMode = validModes.has(mode) ? mode : "icons";
    const labelsVisible = nextMode === "labels";
    body.dataset.detailMenuMode = nextMode;
    toggle.setAttribute("aria-pressed", String(labelsVisible));
    toggle.setAttribute("aria-label", labelsVisible ? "Menulabels verbergen" : "Menulabels tonen");
    toggle.title = labelsVisible ? "Alleen iconen tonen" : "Iconen en labels tonen";
    if (persist) saveMode(nextMode);
    window.dispatchEvent(new Event("resize"));
  }

  toggle.addEventListener("click", () => {
    applyMode(body.dataset.detailMenuMode === "labels" ? "icons" : "labels");
  });

  applyMode(storedMode() || body.dataset.detailMenuMode || "icons", false);
})();
