function getHashForPage(pageName) {
  return PAGE_REGISTRY[pageName]?.hash || PAGE_REGISTRY.dashboard.hash;
}

function getPageForHash(hashValue) {
  return PAGE_HASH_LOOKUP[hashValue] || "dashboard";
}

function navigateToPage(pageName, options = {}) {
  const targetPage = PAGE_REGISTRY[pageName] ? pageName : "dashboard";
  const targetHash = getHashForPage(targetPage);

  if (options.replace) {
    window.history.replaceState(null, "", targetHash);
  } else if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }

  switchPage(targetPage);
  return targetPage;
}

function syncPageButtonsWithRoutes() {
  document.querySelectorAll(".sidebar-link").forEach((button) => {
    const pageName = button.dataset.pageLink;
    button.dataset.route = getHashForPage(pageName);
  });
}
