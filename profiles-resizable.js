(() => {
  const resizeWorkspace = document.querySelector("#workspace");
  const overviewCluster = document.querySelector("#overviewCluster");
  const detailPanel = document.querySelector("#detailPanel");
  const editPanel = document.querySelector("#crudPanel");
  const filterPanel = document.querySelector("#filterPanel");
  const panelResizers = [...document.querySelectorAll(".panel-resizer")];

  if (!resizeWorkspace || !overviewCluster || !detailPanel || !editPanel || !panelResizers.length) return;

  const ratioDefaults = new Map([
    [overviewCluster, 1.15],
    [detailPanel, 1.05],
    [editPanel, .9]
  ]);
  const scalableItems = [...ratioDefaults.keys()];
  let dragState = null;

  function itemName(item) {
    if (item === overviewCluster) return "Overzicht";
    return item.querySelector("h2")?.textContent.trim() || "paneel";
  }

  function isCollapsed(item) {
    return item.hidden || item.classList.contains("is-collapsed");
  }

  function canOpen(item) {
    return item !== overviewCluster && isCollapsed(item) && !item.classList.contains("is-disabled");
  }

  function dividerItems(divider) {
    return [divider.previousElementSibling, divider.nextElementSibling];
  }

  function itemRatio(item) {
    const value = Number.parseFloat(item.style.getPropertyValue("--panel-size"));
    return Number.isFinite(value) && value > 0 ? value : ratioDefaults.get(item);
  }

  function activeScalableItems() {
    return scalableItems.filter((item) => !isCollapsed(item));
  }

  function normalizeActiveRatios() {
    const items = activeScalableItems();
    const totalWidth = items.reduce((sum, item) => sum + item.getBoundingClientRect().width, 0);
    const targetRatioTotal = items.reduce((sum, item) => sum + ratioDefaults.get(item), 0);
    if (!totalWidth || !targetRatioTotal) return;

    items.forEach((item) => {
      const normalized = targetRatioTotal * item.getBoundingClientRect().width / totalWidth;
      item.style.setProperty("--panel-size", normalized.toFixed(5));
    });
  }

  function minimumWidth(item) {
    if (item === overviewCluster && filterPanel && !filterPanel.hidden) {
      const filterWidth = filterPanel.getBoundingClientRect().width || 270;
      return Math.ceil(filterWidth + 348);
    }

    const computed = Number.parseFloat(getComputedStyle(item).minWidth);
    const fallback = item === overviewCluster ? 340 : 280;
    return Math.max(fallback, Number.isFinite(computed) ? computed : 0);
  }

  function dividerMode(divider) {
    if (resizeWorkspace.classList.contains("has-maximized")) return "disabled";
    const [left, right] = dividerItems(divider);
    if (!left || !right) return "disabled";

    const leftOpen = !isCollapsed(left);
    const rightOpen = !isCollapsed(right);
    if (leftOpen && rightOpen) return "resize";
    if (leftOpen && canOpen(right)) return "open-right";
    if (rightOpen && canOpen(left)) return "open-left";
    return "disabled";
  }

  function updateDividerValue(divider) {
    const [left, right] = dividerItems(divider);
    if (!left || !right || isCollapsed(left) || isCollapsed(right)) return;
    const leftWidth = left.getBoundingClientRect().width;
    const rightWidth = right.getBoundingClientRect().width;
    const percentage = Math.round(100 * leftWidth / (leftWidth + rightWidth));
    divider.setAttribute("aria-valuenow", String(percentage));
    divider.setAttribute("aria-valuetext", `${itemName(left)} ${percentage}%, ${itemName(right)} ${100 - percentage}%`);
  }

  function syncPanelResizers() {
    panelResizers.forEach((divider) => {
      const mode = dividerMode(divider);
      const [left, right] = dividerItems(divider);
      const disabled = mode === "disabled";
      const opening = mode.startsWith("open-");

      divider.classList.toggle("is-disabled", disabled);
      divider.classList.toggle("is-open-handle", opening);
      divider.setAttribute("aria-disabled", String(disabled));
      divider.tabIndex = disabled ? -1 : 0;

      if (mode === "open-right") {
        divider.setAttribute("aria-label", `Sleep naar links om ${itemName(right)} te openen`);
        divider.title = `Sleep naar links om ${itemName(right)} te openen`;
      } else if (mode === "open-left") {
        divider.setAttribute("aria-label", `Sleep naar rechts om ${itemName(left)} te openen`);
        divider.title = `Sleep naar rechts om ${itemName(left)} te openen`;
      } else if (mode === "resize") {
        divider.setAttribute("aria-label", `Breedte van ${itemName(left)} en ${itemName(right)} aanpassen`);
        divider.title = "Sleep om te schalen · dubbelklik voor gelijke breedte";
        updateDividerValue(divider);
      } else {
        divider.title = "";
      }
    });
  }

  function startResizeState(divider, event) {
    normalizeActiveRatios();
    const [left, right] = dividerItems(divider);
    const leftWidth = left.getBoundingClientRect().width;
    const rightWidth = right.getBoundingClientRect().width;
    return {
      divider,
      pointerId: event.pointerId,
      mode: "resize",
      startX: event.clientX,
      left,
      right,
      leftWidth,
      rightWidth,
      totalWidth: leftWidth + rightWidth,
      leftMinimum: minimumWidth(left),
      rightMinimum: minimumWidth(right),
      pairRatio: itemRatio(left) + itemRatio(right)
    };
  }

  function endDrag() {
    if (!dragState) return;
    const { divider, pointerId } = dragState;
    if (divider.hasPointerCapture?.(pointerId)) divider.releasePointerCapture(pointerId);
    divider.classList.remove("is-resizing", "is-collapse-pending");
    resizeWorkspace.classList.remove("is-panel-resizing");
    dragState = null;
    requestAnimationFrame(syncPanelResizers);
  }

  function openCollapsedItem(item) {
    const header = item.querySelector(".dependent-header");
    endDrag();
    header?.click();
    requestAnimationFrame(() => {
      normalizeActiveRatios();
      syncPanelResizers();
    });
  }

  function collapseItem(item) {
    const closeButton = item.querySelector(".collapse-dependent");
    endDrag();
    closeButton?.click();
  }

  function applyResize(state, delta, allowCollapse = true) {
    const rawLeft = state.leftWidth + delta;
    const rawRight = state.rightWidth - delta;
    const collapseDistance = 32;
    const leftCanCollapse = state.left !== overviewCluster && !state.left.classList.contains("is-disabled");
    const rightCanCollapse = state.right !== overviewCluster && !state.right.classList.contains("is-disabled");
    const collapseLeft = allowCollapse && leftCanCollapse && rawLeft < state.leftMinimum - collapseDistance;
    const collapseRight = allowCollapse && rightCanCollapse && rawRight < state.rightMinimum - collapseDistance;

    state.divider.classList.toggle(
      "is-collapse-pending",
      rawLeft < state.leftMinimum || rawRight < state.rightMinimum
    );

    if (collapseLeft) {
      collapseItem(state.left);
      return;
    }
    if (collapseRight) {
      collapseItem(state.right);
      return;
    }

    const lowerBound = Math.min(state.leftMinimum, state.totalWidth - state.rightMinimum);
    const upperBound = Math.max(state.leftMinimum, state.totalWidth - state.rightMinimum);
    const nextLeft = Math.min(Math.max(rawLeft, lowerBound), upperBound);
    const share = state.totalWidth > 0 ? nextLeft / state.totalWidth : .5;
    state.left.style.setProperty("--panel-size", Math.max(.05, state.pairRatio * share).toFixed(5));
    state.right.style.setProperty("--panel-size", Math.max(.05, state.pairRatio * (1 - share)).toFixed(5));
    state.divider.setAttribute("aria-valuenow", String(Math.round(share * 100)));
    state.divider.setAttribute(
      "aria-valuetext",
      `${itemName(state.left)} ${Math.round(share * 100)}%, ${itemName(state.right)} ${Math.round((1 - share) * 100)}%`
    );
  }

  panelResizers.forEach((divider) => {
    divider.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const mode = dividerMode(divider);
      if (mode === "disabled") return;

      event.preventDefault();
      divider.setPointerCapture(event.pointerId);
      divider.classList.add("is-resizing");
      resizeWorkspace.classList.add("is-panel-resizing");

      if (mode === "resize") {
        dragState = startResizeState(divider, event);
      } else {
        const [left, right] = dividerItems(divider);
        dragState = {
          divider,
          pointerId: event.pointerId,
          mode,
          startX: event.clientX,
          left,
          right
        };
      }
    });

    divider.addEventListener("pointermove", (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId || dragState.divider !== divider) return;
      const delta = event.clientX - dragState.startX;

      if (dragState.mode === "open-right" && delta <= -16) {
        openCollapsedItem(dragState.right);
        return;
      }
      if (dragState.mode === "open-left" && delta >= 16) {
        openCollapsedItem(dragState.left);
        return;
      }
      if (dragState.mode === "resize") applyResize(dragState, delta);
    });

    divider.addEventListener("pointerup", endDrag);
    divider.addEventListener("pointercancel", endDrag);

    divider.addEventListener("dblclick", () => {
      const mode = dividerMode(divider);
      const [left, right] = dividerItems(divider);
      if (mode === "open-right") return openCollapsedItem(right);
      if (mode === "open-left") return openCollapsedItem(left);
      if (mode !== "resize") return;

      normalizeActiveRatios();
      const equalRatio = (itemRatio(left) + itemRatio(right)) / 2;
      left.style.setProperty("--panel-size", equalRatio.toFixed(5));
      right.style.setProperty("--panel-size", equalRatio.toFixed(5));
      requestAnimationFrame(() => updateDividerValue(divider));
    });

    divider.addEventListener("keydown", (event) => {
      const mode = dividerMode(divider);
      const [left, right] = dividerItems(divider);
      const openRight = mode === "open-right" && ["ArrowLeft", "Enter", " "].includes(event.key);
      const openLeft = mode === "open-left" && ["ArrowRight", "Enter", " "].includes(event.key);

      if (openRight || openLeft) {
        event.preventDefault();
        openCollapsedItem(openRight ? right : left);
        return;
      }

      if (mode !== "resize" || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const keyboardState = startResizeState(divider, {
        clientX: 0,
        pointerId: -1
      });
      applyResize(keyboardState, (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 64 : 24), false);
      requestAnimationFrame(() => updateDividerValue(divider));
    });
  });

  const resizeObserver = new MutationObserver(syncPanelResizers);
  [resizeWorkspace, detailPanel, editPanel, filterPanel].forEach((item) => {
    if (item) resizeObserver.observe(item, { attributes: true, attributeFilter: ["class", "hidden"] });
  });

  window.addEventListener("resize", syncPanelResizers);
  syncPanelResizers();
})();
