(() => {
  const body = document.body;
  const settingsForm = document.querySelector("#prototypeSettingsForm");
  const resetButton = document.querySelector("#resetPrototypeSettings");
  const detailPanel = document.querySelector("#detailPanel");
  const detailContent = document.querySelector("#detailContent");
  const detailMenuPanel = document.querySelector("#detailMenuPanel");
  const detailMenuDivider = document.querySelector("#detailMenuDivider");
  const menuButtons = [...document.querySelectorAll("#detailMenuPanel [data-detail-view]")];
  const relatedPanel = document.querySelector("#relatedContentPanel");
  const relatedDivider = document.querySelector("#detailFlowDivider");
  const relatedTitle = document.querySelector("#relatedContentTitle");
  const relatedBody = document.querySelector("#relatedContentBody");
  const closeRelatedButton = document.querySelector("#closeRelatedContentPanel");
  const editPanel = document.querySelector("#crudPanel");
  const visiblePanelLabel = document.querySelector("#visiblePanelLabel");

  if (!settingsForm || !detailPanel || !detailContent || !detailMenuPanel) return;

  const views = {
    portrait: { title: "Klantenportret", intro: "Een compacte samenvatting van de belangrijkste dossiercontext.", rows: [["Volledigheid", "86%"], ["Open aandachtspunten", "2"], ["Laatste update", "Vandaag"]] },
    profile: { title: "Profiel", intro: "Contactgegevens, dossierstatus en labels van het geselecteerde profiel.", rows: [] },
    professions: { title: "Mijn beroepen", intro: "Beroepsvoorkeuren en kansrijke richtingen voor de volgende stap.", rows: [["Gewenst beroep", "Front-end ontwikkelaar"], ["Ervaringsniveau", "Junior"], ["Kansrijke beroepen", "6"]] },
    vacancies: { title: "Vacature-dashboard", intro: "Vacatures die aansluiten bij het profiel en de afgesproken zoekrichting.", rows: [["Nieuwe matches", "3"], ["Opgeslagen", "5"], ["Volgende opvolging", "Morgen"]] },
    preferences: { title: "Persoonsgegevens en voorkeuren", intro: "Praktische voorkeuren die matching en begeleiding beïnvloeden.", rows: [["Werkregime", "Voltijds"], ["Verplaatsing", "Tot 35 km"], ["Talen", "Nederlands · Arabisch"]] },
    documents: { title: "Documenten", intro: "Documenten die bij het profiel en de actieve begeleiding horen.", rows: [["CV", "Vandaag bijgewerkt"], ["Motivatiebrief", "Concept"], ["Attesten", "2 bestanden"]] },
    messages: { title: "Berichten", intro: "Recente communicatie met de klant en betrokken partners.", rows: [["Ongelezen", "2"], ["Laatste bericht", "Vandaag, 10:14"], ["Kanaal", "Mijn Loopbaan"]] },
    guidance: { title: "Begeleiding", intro: "Lopende afspraken, acties en aandachtspunten in de begeleiding.", rows: [["Volgende afspraak", "12 augustus"], ["Open acties", "3"], ["Traject", "Oriëntatie"]] },
    services: { title: "Dienstverlening", intro: "Ingezette dienstverlening en samenwerkende partners.", rows: [["Actieve dienst", "Taalcoaching"], ["Partner", "Atlas"], ["Startdatum", "21 juli"]] },
    competences: { title: "Competentieontwikkeling", intro: "Competenties die worden gevalideerd of verder ontwikkeld.", rows: [["Bevestigd", "12"], ["In ontwikkeling", "4"], ["Volgende validatie", "September"]] },
    career: { title: "Loopbaangegevens", intro: "Tijdlijn van werkervaring, opleiding en loopbaanonderbrekingen.", rows: [["Werkervaring", "4 jaar"], ["Laatste functie", "Administratief medewerker"], ["Opleidingen", "3"]] },
  };

  let activeView = "profile";
  let decorationScheduled = false;

  function currentPattern() {
    return body.dataset.detailNavigation || "standard";
  }

  function hasSingleProfile() {
    return Boolean(detailContent.querySelector(".context-heading"));
  }

  function detailIsOpen() {
    return !detailPanel.classList.contains("is-collapsed") && !detailPanel.classList.contains("is-disabled");
  }

  function baseSections() {
    return [...detailContent.querySelectorAll(".context-section:not([data-detail-generated])")];
  }

  function cleanupGeneratedContent() {
    detailContent.querySelectorAll(".detail-view-select, [data-detail-generated]").forEach((element) => element.remove());
    baseSections().forEach((section) => { section.hidden = false; });
  }

  function closeRelatedPanel(restoreFocus = false) {
    if (!relatedPanel || relatedPanel.hidden) return;
    relatedPanel.hidden = true;
    if (relatedDivider) relatedDivider.hidden = true;
    relatedPanel.removeAttribute("data-detail-view");
    if (typeof updateWorkspaceStatus === "function") updateWorkspaceStatus();
    window.dispatchEvent(new Event("resize"));
    if (restoreFocus) detailContent.querySelector(`[data-related-view="${activeView}"]`)?.focus();
  }

  function syncMenuVisibility() {
    const show = currentPattern() === "menu" && hasSingleProfile() && detailIsOpen();
    detailMenuPanel.hidden = !show;
    if (detailMenuDivider) detailMenuDivider.hidden = !show;
    detailMenuPanel.setAttribute("aria-hidden", String(!show));
    if (!detailIsOpen() || !hasSingleProfile()) closeRelatedPanel();
    window.dispatchEvent(new Event("resize"));
  }

  function setActiveMenuItem(view) {
    menuButtons.forEach((button) => {
      const active = button.dataset.detailView === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function renderView(view) {
    const definition = views[view] || views.profile;
    activeView = view in views ? view : "profile";
    detailContent.querySelectorAll("[data-detail-generated]").forEach((element) => element.remove());
    baseSections().forEach((section) => { section.hidden = activeView !== "profile"; });
    setActiveMenuItem(activeView);
    const select = detailContent.querySelector("#detailViewSelect");
    if (select) select.value = activeView;
    if (activeView === "profile") return;

    const section = document.createElement("section");
    section.className = "context-section prototype-detail-view";
    section.dataset.detailGenerated = "true";
    const rows = definition.rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");
    section.innerHTML = `<h4>${definition.title}</h4><p>${definition.intro}</p><dl class="data-list">${rows}</dl>`;
    detailContent.append(section);
  }

  function addDropdown(heading) {
    const copy = heading.querySelector(":scope > div");
    if (!copy) return;
    const label = document.createElement("label");
    label.className = "detail-view-select";
    label.innerHTML = `<span class="sr-only">Inhoud van Detail</span><select id="detailViewSelect">${Object.entries(views).map(([value, view]) => `<option value="${value}">${view.title}</option>`).join("")}</select>`;
    if (body.dataset.dropdownWidth === "panel") heading.append(label);
    else copy.insertBefore(label, copy.querySelector("p"));
    label.querySelector("select").addEventListener("change", (event) => renderView(event.target.value));
    renderView(activeView);
  }

  function renderSnippets() {
    baseSections().forEach((section) => { section.hidden = true; });
    const snippets = document.createElement("div");
    snippets.className = "detail-snippets";
    snippets.dataset.detailGenerated = "true";
    snippets.innerHTML = ["vacancies", "documents", "guidance"].map((view) => {
      const definition = views[view];
      return `<article class="detail-snippet"><div><h4>${definition.title}</h4><p>${definition.intro}</p></div><button type="button" data-related-view="${view}">Lees meer <svg aria-hidden="true" viewBox="0 0 18 18"><path d="m7 4 5 5-5 5" /></svg></button></article>`;
    }).join("");
    detailContent.append(snippets);
  }

  function decorateDetail() {
    decorationScheduled = false;
    const heading = detailContent.querySelector(".context-heading");
    syncMenuVisibility();
    if (!heading) {
      cleanupGeneratedContent();
      closeRelatedPanel();
      return;
    }

    const pattern = currentPattern();
    if (heading.dataset.detailPattern === pattern) return;
    closeRelatedPanel();
    cleanupGeneratedContent();
    heading.dataset.detailPattern = pattern;
    if (pattern === "dropdown") addDropdown(heading);
    if (pattern === "menu") renderView(activeView);
    if (pattern === "panel") renderSnippets();
  }

  function scheduleDecoration() {
    if (decorationScheduled) return;
    decorationScheduled = true;
    requestAnimationFrame(decorateDetail);
  }

  function openRelatedPanel(view) {
    const definition = views[view];
    if (!definition || !relatedPanel || !relatedTitle || !relatedBody) return;
    activeView = view;
    if (editPanel && !editPanel.classList.contains("is-collapsed")) {
      editPanel.querySelector(".collapse-dependent")?.click();
    }
    relatedTitle.textContent = definition.title;
    relatedBody.innerHTML = `<div class="related-content-intro"><strong>${definition.title}</strong><span>${definition.intro}</span></div><dl class="data-list">${definition.rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
    relatedPanel.dataset.detailView = view;
    relatedPanel.hidden = false;
    if (relatedDivider) relatedDivider.hidden = false;
    if (visiblePanelLabel) visiblePanelLabel.textContent = `Overzicht | Detail → ${definition.title}`;
    window.dispatchEvent(new Event("resize"));
    requestAnimationFrame(() => relatedTitle.focus({ preventScroll: true }));
  }

  function applyPattern(pattern) {
    body.dataset.detailNavigation = pattern;
    activeView = "profile";
    closeRelatedPanel();
    const heading = detailContent.querySelector(".context-heading");
    if (heading) delete heading.dataset.detailPattern;
    decorateDetail();
  }

  settingsForm.addEventListener("change", (event) => {
    if (event.target.matches('input[name="detailPattern"]')) applyPattern(event.target.value);
  });

  resetButton?.addEventListener("click", () => {
    const defaultPattern = settingsForm.querySelector('input[name="detailPattern"][value="standard"]')
      || settingsForm.querySelector('input[name="detailPattern"][data-default="true"]')
      || settingsForm.querySelector('input[name="detailPattern"]');
    if (!defaultPattern) return;
    defaultPattern.checked = true;
    applyPattern(defaultPattern.value);
  });

  detailMenuPanel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-detail-view]");
    if (button) renderView(button.dataset.detailView);
  });

  detailContent.addEventListener("click", (event) => {
    const button = event.target.closest("[data-related-view]");
    if (button) openRelatedPanel(button.dataset.relatedView);
  });

  closeRelatedButton?.addEventListener("click", () => closeRelatedPanel(true));

  new MutationObserver(scheduleDecoration).observe(detailContent, { childList: true, subtree: true });
  new MutationObserver(syncMenuVisibility).observe(detailPanel, { attributes: true, attributeFilter: ["class", "aria-disabled"] });
  if (editPanel) {
    new MutationObserver(() => {
      if (!editPanel.classList.contains("is-collapsed")) closeRelatedPanel();
    }).observe(editPanel, { attributes: true, attributeFilter: ["class"] });
  }

  applyPattern(settingsForm.querySelector('input[name="detailPattern"]:checked')?.value || "standard");
})();
