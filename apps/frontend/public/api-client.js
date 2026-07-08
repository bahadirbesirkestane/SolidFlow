(function bootstrapApiClient(globalObject) {
  const config = globalObject.APP_CONFIG || {};

  function buildApiUrl(inputPath) {
    const rawPath = String(inputPath || "");
    if (/^https?:\/\//i.test(rawPath)) {
      return rawPath;
    }

    const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
    const baseUrl = normalizeBaseUrl(config.apiBaseUrl || "");
    return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
  }

  function apiFetch(inputPath, options) {
    return fetch(buildApiUrl(inputPath), options);
  }

  function normalizeBaseUrl(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed || trimmed === "/") {
      return "";
    }

    return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
  }

  globalObject.apiClient = {
    buildApiUrl,
    apiFetch,
  };
}(window));
