const profileData = [
  { id: "p1", name: "Amina El Amrani", initials: "AE", city: "Antwerpen", email: "amina.elamrani@example.be", phone: "+32 470 12 34 56", status: "Actief", stage: "Werkervaring in kaart", adviser: "Liesbeth Janssens", updated: 1, date: "Vandaag, 09:42" },
  { id: "p2", name: "Bram Vermeulen", initials: "BV", city: "Mechelen", email: "bram.vermeulen@example.be", phone: "+32 486 23 45 67", status: "Opvolging", stage: "Opleidingsplan", adviser: "Tom Peeters", updated: 2, date: "Gisteren, 16:18" },
  { id: "p3", name: "Chloë De Smet", initials: "CD", city: "Gent", email: "chloe.desmet@example.be", phone: "+32 472 34 56 78", status: "Nieuw", stage: "Intake gepland", adviser: "Liesbeth Janssens", updated: 3, date: "2 dagen geleden" },
  { id: "p4", name: "Daan Maes", initials: "DM", city: "Leuven", email: "daan.maes@example.be", phone: "+32 478 45 67 89", status: "Actief", stage: "Sollicitatiebegeleiding", adviser: "Sarah Wouters", updated: 4, date: "3 dagen geleden" },
  { id: "p5", name: "Elif Kaya", initials: "EK", city: "Hasselt", email: "elif.kaya@example.be", phone: "+32 489 56 78 90", status: "Opvolging", stage: "Werkplekleren", adviser: "Tom Peeters", updated: 5, date: "4 dagen geleden" },
  { id: "p6", name: "Farid Benali", initials: "FB", city: "Brussel", email: "farid.benali@example.be", phone: "+32 471 67 89 01", status: "Actief", stage: "Competenties valideren", adviser: "Sarah Wouters", updated: 6, date: "Vorige week" },
  { id: "p7", name: "Gitte Claes", initials: "GC", city: "Turnhout", email: "gitte.claes@example.be", phone: "+32 475 78 90 12", status: "Nieuw", stage: "Eerste contact", adviser: "Liesbeth Janssens", updated: 7, date: "Vorige week" },
  { id: "p8", name: "Hassan Özdemir", initials: "HO", city: "Kortrijk", email: "hassan.ozdemir@example.be", phone: "+32 488 89 01 23", status: "Actief", stage: "Vacaturematching", adviser: "Tom Peeters", updated: 8, date: "2 weken geleden" },
];

const workspace = document.querySelector("#workspace");
const overviewPanel = document.querySelector("#overviewPanel");
const detailPanel = document.querySelector("#detailPanel");
const crudPanel = document.querySelector("#crudPanel");
const dependentPanels = [detailPanel, crudPanel];
const detailContent = document.querySelector("#detailContent");
const crudContent = document.querySelector("#crudContent");
const profileList = document.querySelector("#profileList");
const emptyResults = document.querySelector("#emptyResults");
const searchInput = document.querySelector("#profileSearch");
const sortSelect = document.querySelector("#profileSort");
const filterButton = document.querySelector("#filterButton");
const filterMenu = document.querySelector("#filterMenu");
const filterCount = document.querySelector("#filterCount");
const selectionRow = document.querySelector("#selectionRow");
const selectionLabel = document.querySelector("#selectionLabel");
const hiddenSelectionLabel = document.querySelector("#hiddenSelectionLabel");
const resultsLabel = document.querySelector("#resultsLabel");
const headerResultCount = document.querySelector("#headerResultCount");
const modeLabel = document.querySelector("#modeLabel");
const visiblePanelLabel = document.querySelector("#visiblePanelLabel");
const focusOverviewButton = document.querySelector("#focusOverviewButton");

const selectedIds = new Set();
let activeFilter = "all";
let overviewFocused = false;

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function visibleProfiles() {
  const query = searchInput.value.trim().toLocaleLowerCase("nl");
  const filtered = profileData.filter((profile) => {
    const matchesFilter = activeFilter === "all" || profile.status === activeFilter;
    const haystack = `${profile.name} ${profile.city} ${profile.email}`.toLocaleLowerCase("nl");
    return matchesFilter && haystack.includes(query);
  });

  return [...filtered].sort((a, b) => {
    if (sortSelect.value === "name") return a.name.localeCompare(b.name, "nl");
    if (sortSelect.value === "status") return a.status.localeCompare(b.status, "nl") || a.name.localeCompare(b.name, "nl");
    return a.updated - b.updated;
  });
}

function renderProfileList() {
  const profiles = visibleProfiles();
  profileList.innerHTML = profiles.map((profile) => `
    <div class="profile-row${selectedIds.has(profile.id) ? " is-selected" : ""}" data-profile-id="${profile.id}" tabindex="0" role="button" aria-label="Open profiel van ${escapeHtml(profile.name)}">
      <input class="profile-check" type="checkbox" aria-label="Selecteer ${escapeHtml(profile.name)}" ${selectedIds.has(profile.id) ? "checked" : ""} />
      <span class="avatar">${profile.initials}</span>
      <div class="profile-main"><strong>${escapeHtml(profile.name)}</strong><span>${escapeHtml(profile.city)} · ${escapeHtml(profile.email)}</span></div>
      <span class="profile-stage">${escapeHtml(profile.stage)}</span>
      <span class="status-pill" data-status="${profile.status}">${profile.status}</span>
      <svg class="row-chevron" aria-hidden="true" viewBox="0 0 18 18"><path d="m7 5 4 4-4 4" /></svg>
    </div>`).join("");

  const resultText = `${profiles.length} ${profiles.length === 1 ? "profiel" : "profielen"}`;
  resultsLabel.textContent = resultText;
  headerResultCount.textContent = String(profiles.length);
  emptyResults.hidden = profiles.length !== 0;
  profileList.hidden = profiles.length === 0;
  updateSelectionBar(profiles);
}

function updateSelectionBar(profiles = visibleProfiles()) {
  const count = selectedIds.size;
  selectionRow.hidden = count === 0;
  if (!count) return;
  selectionLabel.textContent = `${count} ${count === 1 ? "profiel geselecteerd" : "profielen geselecteerd"}`;
  const visibleIds = new Set(profiles.map((profile) => profile.id));
  const hiddenCount = [...selectedIds].filter((id) => !visibleIds.has(id)).length;
  hiddenSelectionLabel.textContent = hiddenCount ? `${hiddenCount} buiten de huidige resultaten` : "Selectie blijft bewaard tijdens zoeken en filteren";
}

function setPanelCollapsed(panel, collapsed, disabled = false) {
  panel.classList.toggle("is-collapsed", collapsed);
  panel.classList.toggle("is-disabled", disabled);
  panel.setAttribute("aria-disabled", String(disabled));
  const header = panel.querySelector(".dependent-header");
  header.tabIndex = collapsed && !disabled ? 0 : -1;
  if (collapsed && !disabled) {
    header.setAttribute("role", "button");
    header.setAttribute("aria-label", `${panel.dataset.panel} opnieuw openen`);
  } else {
    header.removeAttribute("role");
    header.removeAttribute("aria-label");
  }
}

function openDependentPanels() {
  overviewFocused = false;
  workspace.classList.remove("is-overview-focused");
  dependentPanels.forEach((panel) => setPanelCollapsed(panel, false, false));
  updateFocusButton();
}

function focusOverview() {
  if (!selectedIds.size) return;
  overviewFocused = true;
  workspace.classList.add("is-overview-focused");
  dependentPanels.forEach((panel) => setPanelCollapsed(panel, true, false));
  overviewPanel.classList.add("is-active");
  updateFocusButton();
  updateWorkspaceStatus();
}

function updateFocusButton() {
  const hasSelection = selectedIds.size > 0;
  const label = !hasSelection ? "Selecteer eerst een profiel" : overviewFocused ? "Profielcontext opnieuw openen" : "Focus op overzicht";
  focusOverviewButton.disabled = !hasSelection;
  focusOverviewButton.setAttribute("aria-label", label);
  focusOverviewButton.title = label;
}

function selectedProfiles() {
  return profileData.filter((profile) => selectedIds.has(profile.id));
}

function renderDependentContent() {
  const selected = selectedProfiles();
  if (!selected.length) {
    detailContent.innerHTML = "";
    crudContent.innerHTML = "";
    dependentPanels.forEach((panel) => setPanelCollapsed(panel, true, true));
    overviewFocused = false;
    workspace.classList.remove("is-overview-focused");
    updateWorkspaceStatus();
    updateFocusButton();
    return;
  }

  if (selected.length === 1) renderSingleProfile(selected[0]);
  else renderMultipleProfiles(selected);
  if (!overviewFocused) openDependentPanels();
  updateWorkspaceStatus();
}

function renderSingleProfile(profile) {
  detailContent.innerHTML = `
    <div class="context-heading"><span class="context-avatar">${profile.initials}</span><div><h3>${escapeHtml(profile.name)}</h3><p>${profile.status} · ${escapeHtml(profile.stage)}</p></div></div>
    <section class="context-section"><h4>Contact</h4><dl class="data-list"><div><dt>E-mail</dt><dd>${escapeHtml(profile.email)}</dd></div><div><dt>Telefoon</dt><dd>${escapeHtml(profile.phone)}</dd></div><div><dt>Woonplaats</dt><dd>${escapeHtml(profile.city)}</dd></div></dl></section>
    <section class="context-section"><h4>Dossier</h4><dl class="data-list"><div><dt>Status</dt><dd>${profile.status}</dd></div><div><dt>Fase</dt><dd>${escapeHtml(profile.stage)}</dd></div><div><dt>Bemiddelaar</dt><dd>${escapeHtml(profile.adviser)}</dd></div><div><dt>Gewijzigd</dt><dd>${profile.date}</dd></div></dl></section>
    <section class="context-section"><h4>Recente activiteit</h4><div class="timeline"><div class="timeline-item">Dossiernotitie toegevoegd<small>${profile.date}</small></div><div class="timeline-item">Profielgegevens gecontroleerd<small>Vorige week</small></div></div></section>`;

  crudContent.innerHTML = `
    <div class="action-intro"><strong>Profiel bijwerken</strong><span>Wijzigingen gelden alleen voor ${escapeHtml(profile.name)}.</span></div>
    <div class="form-group"><label for="statusEdit">Dossierstatus</label><select class="form-control" id="statusEdit"><option ${profile.status === "Actief" ? "selected" : ""}>Actief</option><option ${profile.status === "Opvolging" ? "selected" : ""}>Opvolging</option><option ${profile.status === "Nieuw" ? "selected" : ""}>Nieuw</option></select></div>
    <div class="form-group"><label for="stageEdit">Volgende stap</label><input class="form-control" id="stageEdit" value="${escapeHtml(profile.stage)}" /></div>
    <div class="form-group"><label for="noteEdit">Interne notitie</label><textarea class="form-control" id="noteEdit" placeholder="Voeg een korte notitie toe"></textarea></div>
    <div class="action-buttons"><button class="button button-secondary" type="button">Annuleren</button><button class="button button-primary" type="button">Bewaren</button></div>`;
}

function renderMultipleProfiles(selected) {
  detailContent.innerHTML = `
    <div class="selection-summary"><strong>${selected.length} profielen geselecteerd</strong><span>Samenvatting van de huidige selectie</span></div>
    <div class="selected-names">${selected.map((profile) => `<div class="selected-name"><i>${profile.initials}</i><span>${escapeHtml(profile.name)}</span></div>`).join("")}</div>
    <section class="context-section"><h4>Verdeling</h4><dl class="data-list"><div><dt>Actief</dt><dd>${selected.filter((profile) => profile.status === "Actief").length}</dd></div><div><dt>Opvolging</dt><dd>${selected.filter((profile) => profile.status === "Opvolging").length}</dd></div><div><dt>Nieuw</dt><dd>${selected.filter((profile) => profile.status === "Nieuw").length}</dd></div></dl></section>`;

  crudContent.innerHTML = `
    <div class="action-intro"><strong>Bulkacties</strong><span>De gekozen actie wordt toegepast op ${selected.length} profielen.</span></div>
    <label class="bulk-option"><input type="radio" name="bulk" checked />Dossierstatus aanpassen</label>
    <label class="bulk-option"><input type="radio" name="bulk" />Bemiddelaar toewijzen</label>
    <label class="bulk-option"><input type="radio" name="bulk" />Opvolgtaak aanmaken</label>
    <div class="form-group"><label for="bulkStatus">Nieuwe status</label><select class="form-control" id="bulkStatus"><option>Actief</option><option>Opvolging</option><option>Nieuw</option></select></div>
    <div class="action-buttons"><button class="button button-secondary" type="button">Annuleren</button><button class="button button-primary" type="button">Toepassen op ${selected.length}</button></div>`;
}

function updateWorkspaceStatus() {
  const count = selectedIds.size;
  if (!count) {
    modeLabel.textContent = "Browsemodus · geen selectie";
    visiblePanelLabel.textContent = "Overzicht + 2 contextuele rails";
  } else if (overviewFocused) {
    modeLabel.textContent = `Overzichtsfocus · ${count} ${count === 1 ? "selectie bewaard" : "selecties bewaard"}`;
    visiblePanelLabel.textContent = "Detail en CRUD tijdelijk ingeklapt";
  } else {
    modeLabel.textContent = count === 1 ? "Profielmodus · 1 selectie" : `Bulkmodus · ${count} selecties`;
    const openCount = dependentPanels.filter((panel) => !panel.classList.contains("is-collapsed")).length;
    visiblePanelLabel.textContent = `${openCount + 1} panelen open`;
  }
}

function selectSingle(profileId) {
  selectedIds.clear();
  selectedIds.add(profileId);
  overviewFocused = false;
  renderProfileList();
  renderDependentContent();
}

function toggleMultiSelection(profileId) {
  if (selectedIds.has(profileId)) selectedIds.delete(profileId);
  else selectedIds.add(profileId);
  overviewFocused = false;
  renderProfileList();
  renderDependentContent();
}

profileList.addEventListener("click", (event) => {
  const row = event.target.closest(".profile-row");
  if (!row) return;
  if (event.target.closest(".profile-check")) toggleMultiSelection(row.dataset.profileId);
  else selectSingle(row.dataset.profileId);
});

profileList.addEventListener("keydown", (event) => {
  const row = event.target.closest(".profile-row");
  if (row && ["Enter", " "].includes(event.key)) {
    event.preventDefault();
    selectSingle(row.dataset.profileId);
  }
});

searchInput.addEventListener("input", renderProfileList);
sortSelect.addEventListener("change", renderProfileList);

filterButton.addEventListener("click", () => {
  filterMenu.hidden = !filterMenu.hidden;
  filterButton.setAttribute("aria-expanded", String(!filterMenu.hidden));
});

filterMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-filter]");
  if (!option) return;
  activeFilter = option.dataset.filter;
  filterMenu.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button === option;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  filterCount.hidden = activeFilter === "all";
  filterMenu.hidden = true;
  filterButton.setAttribute("aria-expanded", "false");
  renderProfileList();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".filter-wrap")) {
    filterMenu.hidden = true;
    filterButton.setAttribute("aria-expanded", "false");
  }
});

document.querySelector("#clearSelectionButton").addEventListener("click", () => {
  selectedIds.clear();
  renderProfileList();
  renderDependentContent();
});

document.querySelector("#resetSearchButton").addEventListener("click", () => {
  searchInput.value = "";
  activeFilter = "all";
  filterCount.hidden = true;
  filterMenu.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === "all";
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  renderProfileList();
});

focusOverviewButton.addEventListener("click", () => {
  if (!selectedIds.size) return;
  if (overviewFocused) {
    openDependentPanels();
    updateWorkspaceStatus();
  } else focusOverview();
});

document.querySelectorAll(".back-action").forEach((button) => button.addEventListener("click", focusOverview));

document.querySelectorAll(".collapse-dependent").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = button.closest(".dependent-panel");
    setPanelCollapsed(panel, true, false);
    updateWorkspaceStatus();
  });
});

dependentPanels.forEach((panel) => {
  const header = panel.querySelector(".dependent-header");
  header.addEventListener("click", () => {
    if (panel.classList.contains("is-collapsed") && !panel.classList.contains("is-disabled")) {
      setPanelCollapsed(panel, false, false);
      overviewFocused = false;
      workspace.classList.remove("is-overview-focused");
      updateFocusButton();
      updateWorkspaceStatus();
    }
  });
  header.addEventListener("keydown", (event) => {
    if (["Enter", " "].includes(event.key) && panel.classList.contains("is-collapsed") && !panel.classList.contains("is-disabled")) {
      event.preventDefault();
      header.click();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !event.target.matches("input, textarea, select")) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") {
    filterMenu.hidden = true;
    filterButton.setAttribute("aria-expanded", "false");
    if (selectedIds.size && !overviewFocused) focusOverview();
  }
});

renderProfileList();
renderDependentContent();
