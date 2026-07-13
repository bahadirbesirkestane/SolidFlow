const LEGACY_FALLBACK_PAGE = "workflow-builder";

function normalizeRoutePath(pathname) {
  if (!pathname || pathname === "/") {
    return PAGE_REGISTRY[LEGACY_FALLBACK_PAGE]?.path || "/legacy/tarama-ve-is-akisi";
  }

  return pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
}

function getPathForPage(pageName) {
  return PAGE_REGISTRY[pageName]?.path || PAGE_REGISTRY[LEGACY_FALLBACK_PAGE]?.path || "/legacy/tarama-ve-is-akisi";
}

function getPageForPath(pathname) {
  return PAGE_PATH_LOOKUP[normalizeRoutePath(pathname)] || LEGACY_FALLBACK_PAGE;
}

function getPageFromLegacyHash(hashValue) {
  return PAGE_HASH_LOOKUP[hashValue] || null;
}

function getPageMeta(pageName) {
  return PAGE_REGISTRY[pageName] || PAGE_REGISTRY[LEGACY_FALLBACK_PAGE];
}

function navigateToPage(pageName, options = {}) {
  const targetPage = PAGE_REGISTRY[pageName] ? pageName : LEGACY_FALLBACK_PAGE;
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
  document.querySelectorAll("[data-page-link]").forEach((link) => {
    const pageName = link.dataset.pageLink;
    link.dataset.route = getPathForPage(pageName);
    link.setAttribute("href", getPathForPage(pageName));
  });
}

function syncPageChrome(pageName) {
  const pageMeta = getPageMeta(pageName);
  const titleElement = document.getElementById("pageHeaderTitle");
  const descriptionElement = document.getElementById("pageHeaderDescription");
  const breadcrumbElement = document.getElementById("pageHeaderPath");
  const topbarTitleElement = document.getElementById("topbarSectionTitle");

  document.title = `SolidFlow | ${pageMeta.title}`;

  if (titleElement) {
    titleElement.textContent = pageMeta.title;
  }

  if (descriptionElement) {
    descriptionElement.textContent = pageMeta.description;
  }

  if (breadcrumbElement) {
    breadcrumbElement.textContent = pageMeta.path;
  }

  if (topbarTitleElement) {
    topbarTitleElement.textContent = pageMeta.title;
  }
}
