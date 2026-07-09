function normalizeRoutePath(pathname) {
  if (!pathname || pathname === "/") {
    return PAGE_REGISTRY.dashboard.path;
  }

  return pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
}

function getPathForPage(pageName) {
  return PAGE_REGISTRY[pageName]?.path || PAGE_REGISTRY.dashboard.path;
}

function getPageForPath(pathname) {
  return PAGE_PATH_LOOKUP[normalizeRoutePath(pathname)] || "dashboard";
}

function getPageFromLegacyHash(hashValue) {
  return PAGE_HASH_LOOKUP[hashValue] || null;
}

function getPageMeta(pageName) {
  return PAGE_REGISTRY[pageName] || PAGE_REGISTRY.dashboard;
}

function navigateToPage(pageName, options = {}) {
  const targetPage = PAGE_REGISTRY[pageName] ? pageName : "dashboard";
  const targetPath = getPathForPage(targetPage);
  const currentPath = normalizeRoutePath(window.location.pathname);

  if (options.replace) {
    window.history.replaceState({ pageName: targetPage }, "", targetPath);
  } else if (currentPath !== targetPath) {
    window.history.pushState({ pageName: targetPage }, "", targetPath);
  }

  switchPage(targetPage);
  syncPageChrome(targetPage);
  return targetPage;
}

function syncPageButtonsWithRoutes() {
  upgradePageLinks();
  ensureSidebarEnhancements();
  ensurePageChrome();

  document.querySelectorAll("[data-page-link]").forEach((link) => {
    const pageName = link.dataset.pageLink;
    link.dataset.route = getPathForPage(pageName);
    link.setAttribute("href", getPathForPage(pageName));
  });
}

function syncPageChrome(pageName) {
  ensurePageChrome();

  const pageMeta = getPageMeta(pageName);
  const titleElement = document.getElementById("pageHeaderTitle");
  const descriptionElement = document.getElementById("pageHeaderDescription");
  const breadcrumbElement = document.getElementById("pageHeaderPath");

  document.title = `Solid Workflow Studio | ${pageMeta.title}`;

  if (titleElement) {
    titleElement.textContent = pageMeta.title;
  }

  if (descriptionElement) {
    descriptionElement.textContent = pageMeta.description;
  }

  if (breadcrumbElement) {
    breadcrumbElement.textContent = pageMeta.path;
  }
}

function upgradePageLinks() {
  document.querySelectorAll("button.sidebar-link[data-page-link]").forEach((button) => {
    const pageMeta = getPageMeta(button.dataset.pageLink);
    const anchor = document.createElement("a");
    anchor.className = button.className;
    anchor.dataset.pageLink = button.dataset.pageLink;
    anchor.href = pageMeta.path;
    anchor.innerHTML = [
      `<span class="sidebar-link-title">${escapeRouteLabel(pageMeta.title)}</span>`,
      `<span class="sidebar-link-desc">${escapeRouteLabel(pageMeta.description)}</span>`,
    ].join("");
    button.replaceWith(anchor);
  });
}

function ensureSidebarEnhancements() {
  const sidebarInner = document.querySelector(".sidebar-inner");
  const sidebarBrand = document.querySelector(".sidebar-brand");
  if (!sidebarInner || !sidebarBrand || document.querySelector(".sidebar-quick-card")) {
    return;
  }

  const quickCard = document.createElement("div");
  quickCard.className = "sidebar-quick-card";
  quickCard.innerHTML = `
    <p class="sidebar-label">Hızlı Başlangıç</p>
    <strong>Bugün neyi yönetmek istiyorsun?</strong>
    <span class="muted">Menü bağlantıları gerçek sayfa adresleriyle çalışır. İstersen yeni sekmede açabilirsin.</span>
  `;

  sidebarBrand.insertAdjacentElement("afterend", quickCard);
}

function ensurePageChrome() {
  const workspaceContent = document.querySelector(".workspace-content");
  if (!workspaceContent || document.getElementById("pageHeaderTitle")) {
    return;
  }

  const pageTopbar = document.createElement("section");
  pageTopbar.className = "page-topbar";
  pageTopbar.innerHTML = `
    <div class="page-topbar-copy">
      <p id="pageHeaderPath" class="eyebrow">${PAGE_REGISTRY.dashboard.path}</p>
      <h2 id="pageHeaderTitle">${PAGE_REGISTRY.dashboard.title}</h2>
      <p id="pageHeaderDescription" class="muted">${PAGE_REGISTRY.dashboard.description}</p>
    </div>
    <div class="page-topbar-note">
      <p class="sidebar-label">Gezinme</p>
      <strong>Gerçek sayfa adresleri aktif</strong>
      <span class="muted">Menü bağlantıları yeni sekmede açılabilir ve tarayıcı geçmişiyle uyumlu çalışır.</span>
    </div>
  `;

  workspaceContent.prepend(pageTopbar);
}

function escapeRouteLabel(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
