const profileData = [
  { id: "p1", name: "Amina El Amrani", initials: "AE", city: "Antwerpen", region: "Antwerpen", email: "amina.elamrani@example.be", phone: "+32 470 12 34 56", status: "Actief", stage: "Werkervaring in kaart", stageGroup: "Oriëntatie", adviser: "Liesbeth Janssens", tags: ["Taalondersteuning", "CV nagekeken"], updated: 0, date: "Vandaag, 09:42" },
  { id: "p2", name: "Bram Vermeulen", initials: "BV", city: "Mechelen", region: "Antwerpen", email: "bram.vermeulen@example.be", phone: "+32 486 23 45 67", status: "Opvolging", stage: "Opleidingsplan", stageGroup: "Opleiding", adviser: "Tom Peeters", tags: ["Opleiding", "Opvolging nodig"], updated: 1, date: "Gisteren, 16:18" },
  { id: "p3", name: "Chloë De Smet", initials: "CD", city: "Gent", region: "Oost-Vlaanderen", email: "chloe.desmet@example.be", phone: "+32 472 34 56 78", status: "Nieuw", stage: "Intake gepland", stageGroup: "Intake", adviser: "Liesbeth Janssens", tags: ["Nieuwe inschrijving"], updated: 2, date: "2 dagen geleden" },
  { id: "p4", name: "Daan Maes", initials: "DM", city: "Leuven", region: "Vlaams-Brabant en Brussel", email: "daan.maes@example.be", phone: "+32 478 45 67 89", status: "Actief", stage: "Sollicitatiebegeleiding", stageGroup: "Matching", adviser: "Sarah Wouters", tags: ["Prioritair", "Sollicitatie"], updated: 3, date: "3 dagen geleden" },
  { id: "p5", name: "Elif Kaya", initials: "EK", city: "Hasselt", region: "Limburg", email: "elif.kaya@example.be", phone: "+32 489 56 78 90", status: "Opvolging", stage: "Werkplekleren", stageGroup: "Opleiding", adviser: "Tom Peeters", tags: ["Opleiding", "Werkplekleren"], updated: 4, date: "4 dagen geleden" },
  { id: "p6", name: "Farid Benali", initials: "FB", city: "Brussel", region: "Vlaams-Brabant en Brussel", email: "farid.benali@example.be", phone: "+32 471 67 89 01", status: "Actief", stage: "Competenties valideren", stageGroup: "Oriëntatie", adviser: "Sarah Wouters", tags: ["Taalondersteuning", "Competenties"], updated: 6, date: "6 dagen geleden" },
  { id: "p7", name: "Gitte Claes", initials: "GC", city: "Turnhout", region: "Antwerpen", email: "gitte.claes@example.be", phone: "+32 475 78 90 12", status: "Nieuw", stage: "Eerste contact", stageGroup: "Intake", adviser: "Liesbeth Janssens", tags: ["Nieuwe inschrijving"], updated: 7, date: "Vorige week" },
  { id: "p8", name: "Hassan Özdemir", initials: "HO", city: "Kortrijk", region: "West-Vlaanderen", email: "hassan.ozdemir@example.be", phone: "+32 488 89 01 23", status: "Actief", stage: "Vacaturematching", stageGroup: "Matching", adviser: "Tom Peeters", tags: ["Prioritair", "Vacaturematch"], updated: 14, date: "2 weken geleden" },
];

const filterLabels = {
  statusFilter: "Status",
  stageFilter: "Fase",
  regionFilter: "Regio",
  adviserFilter: "Bemiddelaar",
  tagFilter: "Label",
};

const timeLabels = { 0: "Vandaag", 7: "7 dagen", 30: "30 dagen" };

const workspace = document.querySelector("#workspace");
const overviewCluster = document.querySelector("#overviewCluster");
const overviewPanel = document.querySelector("#overviewPanel");
const filterPanel = document.querySelector("#filterPanel");
const utilityDivider = document.querySelector("#utilityDivider");
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
const filterCount = document.querySelector("#filterCount");
const filterSummary = document.querySelector("#filterSummary");
const filterSummaryCount = document.querySelector("#filterSummaryCount");
const filterSummaryText = document.querySelector("#filterSummaryText");
const filterResultPreview = document.querySelector("#filterResultPreview");
const linkedState = document.querySelector("#linkedState");
const linkedStateLabel = document.querySelector("#linkedStateLabel");
const selectionRow = document.querySelector("#selectionRow");
const selectionLabel = document.querySelector("#selectionLabel");
const hiddenSelectionLabel = document.querySelector("#hiddenSelectionLabel");
const resultsLabel = document.querySelector("#resultsLabel");
const headerResultCount = document.querySelector("#headerResultCount");
const modeLabel = document.querySelector("#modeLabel");
const visiblePanelLabel = document.querySelector("#visiblePanelLabel");
const focusOverviewButton = document.querySelector("#focusOverviewButton");
const editDetailButton = document.querySelector("#editDetailButton");
const editDetailLabel = document.querySelector("#editDetailLabel");
const editorOnDemand = document.body.dataset.editorMode === "on-demand";

const selectedIds = new Set();
let overviewFocused = false;
let resizeState = null;
let editorOpen = !editorOnDemand;
let preserveClosedDetailForSelection = false;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function selectedValues(name) {
  return new Set([...filterPanel.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value));
}

function currentFilterState() {
  return {
    statuses: selectedValues("statusFilter"),
    stages: selectedValues("stageFilter"),
    regions: selectedValues("regionFilter"),
    advisers: selectedValues("adviserFilter"),
    tags: selectedValues("tagFilter"),
    time: filterPanel.querySelector('input[name="timeFilter"]:checked').value,
  };
}

function matchesValue(selected, value) {
  return selected.size === 0 || selected.has(value);
}

function visibleProfiles() {
  const query = searchInput.value.trim().toLocaleLowerCase("nl");
  const filters = currentFilterState();
  const filtered = profileData.filter((profile) => {
    const haystack = [profile.name, profile.city, profile.region, profile.email, profile.status, profile.stage, profile.stageGroup, profile.adviser, ...profile.tags].join(" ").toLocaleLowerCase("nl");
    const matchesTags = filters.tags.size === 0 || [...filters.tags].some((tag) => profile.tags.includes(tag));
    const matchesTime = filters.time === "all" || profile.updated <= Number(filters.time);
    return haystack.includes(query)
      && matchesValue(filters.statuses, profile.status)
      && matchesValue(filters.stages, profile.stageGroup)
      && matchesValue(filters.regions, profile.region)
      && matchesValue(filters.advisers, profile.adviser)
      && matchesTags
      && matchesTime;
  });

  return [...filtered].sort((a, b) => {
    if (sortSelect.value === "name") return a.name.localeCompare(b.name, "nl");
    if (sortSelect.value === "status") return a.status.localeCompare(b.status, "nl") || a.name.localeCompare(b.name, "nl");
    if (sortSelect.value === "city") return a.city.localeCompare(b.city, "nl") || a.name.localeCompare(b.name, "nl");
    return a.updated - b.updated;
  });
}

function activeFilterItems() {
  const items = [];
  Object.entries(filterLabels).forEach(([name, label]) => {
    filterPanel.querySelectorAll(`input[name="${name}"]:checked`).forEach((input) => items.push(`${label}: ${input.value}`));
  });
  const time = filterPanel.querySelector('input[name="timeFilter"]:checked').value;
  if (time !== "all") items.push(`Gewijzigd: ${timeLabels[time]}`);
  return items;
}

function renderFilterSummary(resultCount) {
  const items = activeFilterItems();
  const count = items.length;
  const filterOpen = !filterPanel.hidden;
  filterCount.textContent = String(count);
  filterCount.hidden = count === 0;
  filterSummary.hidden = count === 0;
  filterSummaryCount.textContent = String(count);
  filterSummaryText.textContent = count > 3 ? `${items.slice(0, 3).join(" · ")} +${count - 3}` : items.join(" · ");
  filterResultPreview.textContent = `${resultCount} ${resultCount === 1 ? "profiel" : "profielen"}`;
  filterButton.classList.toggle("is-active", count > 0 || filterOpen);
  linkedState.hidden = count === 0 && !filterOpen;
  linkedStateLabel.textContent = filterOpen ? "filterpaneel links" : "gefilterd links";
}

function renderProfileSelection(profile) {
  const input = `<input class="profile-check" type="checkbox" aria-label="Selecteer ${escapeHtml(profile.name)}" ${selectedIds.has(profile.id) ? "checked" : ""} />`;
  return document.body.dataset.selectionHitarea === "cell"
    ? `<label class="profile-select-target">${input}</label>`
    : input;
}

function renderProfileList() {
  const profiles = visibleProfiles();
  const tableView = document.body.dataset.overviewPresentation === "table";
  profileList.classList.toggle("is-table-view", tableView);
  profileList.innerHTML = tableView ? `
    <div class="table-scroll profile-table-scroll" data-table-scroll>
      <table class="profile-table">
        <thead><tr>
          <th class="table-select"><span class="sr-only">Selectie</span></th>
          <th>Profiel</th>
          <th>Status</th>
          <th>Fase</th>
          <th>Regio</th>
          <th>Bemiddelaar</th>
          <th>Gewijzigd</th>
          <th class="table-open"><span class="sr-only">Openen</span></th>
        </tr></thead>
        <tbody>${profiles.map((profile) => `
          <tr class="profile-row${selectedIds.has(profile.id) ? " is-selected" : ""}" data-profile-id="${profile.id}" tabindex="0" aria-label="Open profiel van ${escapeHtml(profile.name)}">
            <td class="table-select">${renderProfileSelection(profile)}</td>
            <td><div class="table-profile"><span class="avatar">${profile.initials}</span><div class="profile-main"><strong>${escapeHtml(profile.name)}</strong><span>${escapeHtml(profile.email)}</span></div></div></td>
            <td><span class="status-pill" data-status="${profile.status}">${profile.status}</span></td>
            <td class="table-stage">${escapeHtml(profile.stage)}</td>
            <td>${escapeHtml(profile.region)}</td>
            <td>${escapeHtml(profile.adviser)}</td>
            <td class="table-updated">${escapeHtml(profile.date)}</td>
            <td class="table-open"><svg class="row-chevron" aria-hidden="true" viewBox="0 0 18 18"><path d="m7 5 4 4-4 4" /></svg></td>
          </tr>`).join("")}</tbody>
      </table>
    </div>` : profiles.map((profile) => `
      <div class="profile-row${selectedIds.has(profile.id) ? " is-selected" : ""}" data-profile-id="${profile.id}" tabindex="0" role="button" aria-label="Open profiel van ${escapeHtml(profile.name)}">
        ${renderProfileSelection(profile)}
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
  renderFilterSummary(profiles.length);
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

function syncEditorState() {
  const visiblyOpen = editorOnDemand && editorOpen && !crudPanel.classList.contains("is-collapsed");
  workspace.classList.toggle("is-editor-open", visiblyOpen);
  if (!editDetailButton) return;
  editDetailButton.classList.toggle("is-active", visiblyOpen);
  editDetailButton.setAttribute("aria-expanded", String(visiblyOpen));
  editDetailButton.title = visiblyOpen ? "Bewerkingspaneel is open" : "Profiel bewerken";
}

function openDependentPanels() {
  overviewFocused = false;
  workspace.classList.remove("is-overview-focused");
  setPanelCollapsed(detailPanel, false, false);
  setPanelCollapsed(crudPanel, editorOnDemand && !editorOpen, false);
  syncEditorState();
  updateFocusButton();
}

function focusOverview() {
  if (!selectedIds.size) return;
  if (!filterPanel.hidden) closeFilterPanel(false);
  overviewFocused = true;
  workspace.classList.add("is-overview-focused");
  dependentPanels.forEach((panel) => setPanelCollapsed(panel, true, false));
  overviewPanel.classList.add("is-active");
  syncEditorState();
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
    editorOpen = false;
    detailContent.innerHTML = "";
    crudContent.innerHTML = "";
    dependentPanels.forEach((panel) => setPanelCollapsed(panel, true, true));
    overviewFocused = false;
    workspace.classList.remove("is-overview-focused");
    updateWorkspaceStatus();
    updateFocusButton();
    syncEditorState();
    return;
  }

  if (selected.length === 1) renderSingleProfile(selected[0]);
  else renderMultipleProfiles(selected);
  if (editDetailLabel) editDetailLabel.textContent = selected.length === 1 ? "Bewerken" : `${selected.length} bewerken`;
  if (filterPanel.hidden && !overviewFocused && !preserveClosedDetailForSelection) openDependentPanels();
  else {
    dependentPanels.forEach((panel) => setPanelCollapsed(panel, true, false));
    syncEditorState();
  }
  updateWorkspaceStatus();
}

function renderSingleProfile(profile) {
  detailContent.innerHTML = `
    <div class="context-heading"><span class="context-avatar">${profile.initials}</span><div><h3>${escapeHtml(profile.name)}</h3><p>${profile.status} · ${escapeHtml(profile.stage)}</p></div></div>
    <section class="context-section"><h4>Contact</h4><dl class="data-list"><div><dt>E-mail</dt><dd>${escapeHtml(profile.email)}</dd></div><div><dt>Telefoon</dt><dd>${escapeHtml(profile.phone)}</dd></div><div><dt>Woonplaats</dt><dd>${escapeHtml(profile.city)}</dd></div></dl></section>
    <section class="context-section"><h4>Dossier</h4><dl class="data-list"><div><dt>Status</dt><dd>${profile.status}</dd></div><div><dt>Fase</dt><dd>${escapeHtml(profile.stage)}</dd></div><div><dt>Bemiddelaar</dt><dd>${escapeHtml(profile.adviser)}</dd></div><div><dt>Gewijzigd</dt><dd>${profile.date}</dd></div></dl></section>
    <section class="context-section"><h4>Labels</h4><div class="selected-names">${profile.tags.map((tag) => `<div class="selected-name"><span>${escapeHtml(tag)}</span></div>`).join("")}</div></section>`;

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
  const fullscreenOwner = workspace.querySelector(".panel.is-maximized");
  const usesOwnerGroups = document.body.dataset.panelManagement === "owner-groups"
    || document.body.dataset.preserveOwnerFullscreen === "true";
  if (usesOwnerGroups && fullscreenOwner) {
    const ownerName = fullscreenOwner.querySelector("h1, h2")?.textContent.trim() || "Paneel";
    const ownerCluster = fullscreenOwner.closest(".panel-cluster");
    const linkedNames = ownerCluster
      ? [...ownerCluster.children]
        .filter((item) => item.matches?.(".panel:not(.is-collapsed):not([hidden])") && item !== fullscreenOwner)
        .map((item) => item.querySelector("h1, h2")?.textContent.trim() || item.dataset.panel || "Paneel")
      : [];
    modeLabel.textContent = `Volledige focus · ${ownerName}`;
    visiblePanelLabel.textContent = `${ownerName}${linkedNames.length ? ` + ${linkedNames.join(" + ")}` : ""} in volledige focus${document.body.dataset.fullscreenOthers === "rails" ? " · andere groepen als rail" : ""}`;
    return;
  }
  const count = selectedIds.size;
  const filterTotal = activeFilterItems().length;
  if (!filterPanel.hidden) {
    modeLabel.textContent = `Filtermodus · ${filterTotal || "geen"} ${filterTotal === 1 ? "criterium" : "criteria"} actief`;
    visiblePanelLabel.textContent = "Filters → Overzicht · profielcontext als rails";
  } else if (!count) {
    modeLabel.textContent = "Browsemodus · geen selectie";
    visiblePanelLabel.textContent = "Overzicht + 2 contextuele rails";
  } else if (overviewFocused) {
    modeLabel.textContent = `Overzichtsfocus · ${count} ${count === 1 ? "selectie bewaard" : "selecties bewaard"}`;
    visiblePanelLabel.textContent = editorOnDemand ? "Detail en Bewerken tijdelijk ingeklapt" : "Detail en CRUD tijdelijk ingeklapt";
  } else {
    modeLabel.textContent = count === 1 ? "Profielmodus · 1 selectie" : `Bulkmodus · ${count} selecties`;
    const openCount = dependentPanels.filter((panel) => !panel.classList.contains("is-collapsed")).length;
    visiblePanelLabel.textContent = `${openCount + 1} panelen open`;
  }
}

function openFilterPanel() {
  if (!filterPanel.hidden) return;
  filterPanel.hidden = false;
  utilityDivider.hidden = false;
  workspace.classList.add("is-utility-open");
  workspace.classList.remove("is-overview-focused");
  overviewFocused = false;
  dependentPanels.forEach((panel) => setPanelCollapsed(panel, true, selectedIds.size === 0));
  syncEditorState();
  filterButton.setAttribute("aria-expanded", "true");
  renderFilterSummary(visibleProfiles().length);
  updateFocusButton();
  updateWorkspaceStatus();
}

function closeFilterPanel(restoreContext = true) {
  if (filterPanel.hidden) return;
  filterPanel.hidden = true;
  utilityDivider.hidden = true;
  workspace.classList.remove("is-utility-open", "is-resizing");
  filterButton.setAttribute("aria-expanded", "false");
  if (restoreContext && selectedIds.size) openDependentPanels();
  else if (!selectedIds.size) dependentPanels.forEach((panel) => setPanelCollapsed(panel, true, true));
  syncEditorState();
  renderFilterSummary(visibleProfiles().length);
  updateFocusButton();
  updateWorkspaceStatus();
}

function selectSingle(profileId) {
  if (!filterPanel.hidden) closeFilterPanel(false);
  if (editorOnDemand) editorOpen = false;
  preserveClosedDetailForSelection = false;
  selectedIds.clear();
  selectedIds.add(profileId);
  overviewFocused = false;
  renderProfileList();
  renderDependentContent();
}

function toggleMultiSelection(profileId) {
  if (!filterPanel.hidden) closeFilterPanel(false);
  if (editorOnDemand) editorOpen = false;
  const preserveClosedDetail = document.body.dataset.selectionBehavior === "row-opens-detail"
    && detailPanel.classList.contains("is-collapsed")
    && !detailPanel.classList.contains("is-disabled");
  if (selectedIds.has(profileId)) selectedIds.delete(profileId);
  else selectedIds.add(profileId);
  overviewFocused = false;
  preserveClosedDetailForSelection = preserveClosedDetail;
  renderProfileList();
  renderDependentContent();
  preserveClosedDetailForSelection = false;
}

function clearFilters(includeSearch = false) {
  filterPanel.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
  filterPanel.querySelector('input[name="timeFilter"][value="all"]').checked = true;
  if (includeSearch) searchInput.value = "";
  renderProfileList();
  updateWorkspaceStatus();
}

function clampFilterWidth(width) {
  const availableMax = Math.max(270, overviewCluster.getBoundingClientRect().width - 340);
  return Math.min(Math.max(width, 270), Math.min(500, availableMax));
}

function setFilterWidth(width) {
  const nextWidth = clampFilterWidth(width);
  filterPanel.style.setProperty("--utility-width", `${nextWidth}px`);
  utilityDivider.setAttribute("aria-valuenow", String(Math.round(nextWidth)));
}

profileList.addEventListener("click", (event) => {
  const row = event.target.closest(".profile-row");
  if (!row) return;
  if (event.target.closest(".profile-select-target, .profile-check")) {
    event.preventDefault();
    event.stopPropagation();
    toggleMultiSelection(row.dataset.profileId);
    return;
  }
  selectSingle(row.dataset.profileId);
});

profileList.addEventListener("keydown", (event) => {
  if (event.target.closest(".profile-select-target, .profile-check")) return;
  const row = event.target.closest(".profile-row");
  if (row && ["Enter", " "].includes(event.key)) {
    event.preventDefault();
    selectSingle(row.dataset.profileId);
  }
});

searchInput.addEventListener("input", renderProfileList);
sortSelect.addEventListener("change", renderProfileList);
filterPanel.addEventListener("change", () => {
  renderProfileList();
  updateWorkspaceStatus();
});

filterButton.addEventListener("click", () => filterPanel.hidden ? openFilterPanel() : closeFilterPanel());
filterSummary.addEventListener("click", openFilterPanel);
document.querySelector("#closeFilterButton").addEventListener("click", () => {
  closeFilterPanel();
  filterButton.focus();
});
document.querySelector("#clearFiltersButton").addEventListener("click", () => clearFilters());

if (editDetailButton) {
  editDetailButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!selectedIds.size) return;
    editorOpen = true;
    overviewFocused = false;
    workspace.classList.remove("is-overview-focused");
    setPanelCollapsed(detailPanel, false, false);
    setPanelCollapsed(crudPanel, false, false);
    syncEditorState();
    updateWorkspaceStatus();
  });
}

document.querySelector("#clearSelectionButton").addEventListener("click", () => {
  selectedIds.clear();
  renderProfileList();
  renderDependentContent();
});

document.querySelector("#resetSearchButton").addEventListener("click", () => {
  clearFilters(true);
  searchInput.focus();
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
    if (editorOnDemand && panel === detailPanel) {
      editorOpen = false;
      setPanelCollapsed(detailPanel, true, false);
      setPanelCollapsed(crudPanel, true, false);
    } else {
      if (editorOnDemand && panel === crudPanel) editorOpen = false;
      setPanelCollapsed(panel, true, false);
    }
    syncEditorState();
    updateWorkspaceStatus();
  });
});

dependentPanels.forEach((panel) => {
  const header = panel.querySelector(".dependent-header");
  header.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    if (!panel.classList.contains("is-collapsed") || panel.classList.contains("is-disabled")) return;
    if (!filterPanel.hidden) {
      closeFilterPanel(false);
      if (editorOnDemand && panel === crudPanel) editorOpen = true;
      openDependentPanels();
    } else {
      if (editorOnDemand && panel === crudPanel) {
        editorOpen = true;
        setPanelCollapsed(detailPanel, false, false);
        setPanelCollapsed(crudPanel, false, false);
      } else {
        setPanelCollapsed(panel, false, false);
      }
    }
    overviewFocused = false;
    workspace.classList.remove("is-overview-focused");
    updateFocusButton();
    syncEditorState();
    updateWorkspaceStatus();
  });
  header.addEventListener("keydown", (event) => {
    if (["Enter", " "].includes(event.key) && panel.classList.contains("is-collapsed") && !panel.classList.contains("is-disabled")) {
      event.preventDefault();
      header.click();
    }
  });
});

utilityDivider.addEventListener("pointerdown", (event) => {
  resizeState = { startX: event.clientX, startWidth: filterPanel.getBoundingClientRect().width };
  utilityDivider.setPointerCapture(event.pointerId);
  workspace.classList.add("is-resizing");
});

utilityDivider.addEventListener("pointermove", (event) => {
  if (!resizeState) return;
  setFilterWidth(resizeState.startWidth + (event.clientX - resizeState.startX));
});

function stopResize(event) {
  if (!resizeState) return;
  resizeState = null;
  workspace.classList.remove("is-resizing");
  if (utilityDivider.hasPointerCapture(event.pointerId)) utilityDivider.releasePointerCapture(event.pointerId);
}

utilityDivider.addEventListener("pointerup", stopResize);
utilityDivider.addEventListener("pointercancel", stopResize);
utilityDivider.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const currentWidth = filterPanel.getBoundingClientRect().width;
  setFilterWidth(currentWidth + (event.key === "ArrowRight" ? 20 : -20));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !event.target.matches("input, textarea, select")) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") {
    if (!filterPanel.hidden) {
      closeFilterPanel();
      filterButton.focus();
      return;
    }
    if (selectedIds.size && !overviewFocused) focusOverview();
  }
});

renderProfileList();
renderDependentContent();
