const APP_PAGE_RENDER_ORDER = window.APP_PAGE_RENDER_ORDER || [];
const DEFAULT_LEGACY_PAGE = APP_PAGE_RENDER_ORDER[0] || "workflow-builder";

(function renderAppShell() {
  const root = document.getElementById("appRoot");
  if (!root) {
    return;
  }

  const pagePanels = APP_PAGE_RENDER_ORDER.map((pageName) => `
    <section class="page-panel ${pageName === DEFAULT_LEGACY_PAGE ? "active" : ""}" data-page="${pageName}">
      ${window.APP_PAGE_TEMPLATES?.[pageName] || ""}
    </section>
  `).join("");

  root.innerHTML = window.APP_LAYOUT_SHELL.replace(
    '<div id="pageStack" class="page-stack"></div>',
    `<div id="pageStack" class="page-stack">${pagePanels}</div>`,
  );
}());
