const APP_PAGE_RENDER_ORDER = [
  "dashboard",
  "projects",
  "user-workspace",
  "workflow-builder",
  "erp-center",
  "rule-file-types",
  "rule-keywords",
  "rule-file-names",
  "rule-overrides",
  "open-jobs-monitor",
  "audit-center",
  "reports-center",
  "team-center",
  "settings-center",
  "data-center",
  "approval-center",
  "integration-center",
  "process-guide",
];

(function renderAppShell() {
  const root = document.getElementById("appRoot");
  if (!root) {
    return;
  }

  const pagePanels = APP_PAGE_RENDER_ORDER.map((pageName) => `
    <section class="page-panel ${pageName === "dashboard" ? "active" : ""}" data-page="${pageName}">
      ${window.APP_PAGE_TEMPLATES?.[pageName] || ""}
    </section>
  `).join("");

  root.innerHTML = window.APP_LAYOUT_SHELL.replace(
    '<div id="pageStack" class="page-stack"></div>',
    `<div id="pageStack" class="page-stack">${pagePanels}</div>`,
  );
}());
