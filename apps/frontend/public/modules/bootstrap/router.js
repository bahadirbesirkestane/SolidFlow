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
}
