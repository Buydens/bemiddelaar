(() => {
  const contentWorkspace = document.querySelector("#workspace");
  const contentDetail = document.querySelector("#detailContent");
  const contentEditPanel = document.querySelector("#crudPanel");

  if (!contentWorkspace || !contentDetail || !contentEditPanel) return;

  function focusEditForm() {
    const firstControl = contentEditPanel.querySelector("input, select, textarea, button");
    contentEditPanel.classList.remove("content-action-target");
    void contentEditPanel.offsetWidth;
    contentEditPanel.classList.add("content-action-target");
    firstControl?.focus({ preventScroll: true });
    firstControl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    window.setTimeout(() => contentEditPanel.classList.remove("content-action-target"), 480);
  }

  function activateEditing() {
    const maximized = contentWorkspace.querySelector(".panel.is-maximized");
    const usesOwnerGroups = document.body.dataset.panelManagement === "owner-groups"
      || document.body.dataset.preserveOwnerFullscreen === "true";
    const preserveOwnerFullscreen = usesOwnerGroups
      && maximized?.closest(".panel-cluster") === contentEditPanel.closest(".panel-cluster");
    if (maximized && !preserveOwnerFullscreen) maximized.querySelector(".maximize-action")?.click();

    const toggleEditing = document.body.dataset.editToggle === "true";
    if (toggleEditing && !contentEditPanel.classList.contains("is-collapsed")) {
      contentEditPanel.querySelector(".collapse-dependent")?.click();
      return;
    }

    if (contentEditPanel.classList.contains("is-collapsed")) {
      contentEditPanel.querySelector(".dependent-header")?.click();
    }

    requestAnimationFrame(focusEditForm);
  }

  function createEditAction(label) {
    const button = document.createElement("button");
    button.className = "content-edit-action";
    button.type = "button";
    button.setAttribute("aria-controls", "crudPanel");
    button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 18 18"><path d="m4 12.75-.75 2.5 2.5-.75 7.8-7.8-1.75-1.75zM10.8 5.95l1.75 1.75" /></svg><span>${label}</span>`;
    button.addEventListener("click", activateEditing);
    return button;
  }

  function syncContentAction() {
    const host = contentDetail.querySelector(".context-heading, .selection-summary");
    if (!host) return;

    const multiple = host.classList.contains("selection-summary");
    let action = host.querySelector(".content-edit-action");
    if (!action) {
      action = createEditAction(multiple ? "Selectie bewerken" : "Bewerken");
      host.append(action);
    }

    const label = multiple ? "Selectie bewerken" : "Bewerken";
    const open = !contentEditPanel.classList.contains("is-collapsed");
    const toggleEditing = document.body.dataset.editToggle === "true";
    action.querySelector("span").textContent = toggleEditing && open ? "Bewerken sluiten" : label;
    action.setAttribute("aria-expanded", String(open));
    action.setAttribute("aria-label", toggleEditing && open ? "Bewerken sluiten" : open ? `${label}; ga naar het formulier` : `${label}; open het formulier`);
    action.title = toggleEditing && open ? "Bewerkingspaneel sluiten" : open ? "Ga naar het bewerkingsformulier" : "Open het bewerkingsformulier";
  }

  new MutationObserver(syncContentAction).observe(contentDetail, { childList: true });
  new MutationObserver(syncContentAction).observe(contentEditPanel, { attributes: true, attributeFilter: ["class"] });
  syncContentAction();
})();
