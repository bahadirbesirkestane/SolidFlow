const fs = require("fs");
const path = require("path");
const { loadEnvFile } = require("./env-loader");

function createAppConfig({ rootPath }) {
  loadEnvFile(rootPath);

  const host = String(process.env.APP_HOST || "127.0.0.1").trim();
  const port = Number(process.env.APP_PORT || 3000);
  const publicDir = resolvePath(rootPath, process.env.FRONTEND_PUBLIC_DIR, path.join(rootPath, "apps", "frontend", "public"));
  const requestedDefaultScanDir = resolvePath(rootPath, process.env.DEFAULT_SCAN_DIR, path.join(rootPath, "IN26016_TARTIM KONVOYOR"));
  const defaultScanDir = fs.existsSync(requestedDefaultScanDir) ? requestedDefaultScanDir : rootPath;
  const dataDir = resolvePath(rootPath, process.env.DATA_DIR, path.join(rootPath, "data"));
  const apiBaseUrl = normalizeApiBaseUrl(process.env.FRONTEND_API_BASE_URL || "");

  return {
    server: {
      host,
      port: Number.isFinite(port) ? port : 3000,
    },
    paths: {
      rootPath,
      publicDir,
      defaultScanDir,
      dataDir,
    },
    frontend: {
      apiBaseUrl,
    },
    cadConversion: {
      enabled: normalizeBoolean(process.env.CAD_CONVERSION_ENABLED, false),
      timeoutMs: Number(process.env.CAD_CONVERSION_TIMEOUT_MS || 180000),
      converterExecutable: String(process.env.CAD_CONVERTER_EXECUTABLE || process.env.FREECAD_CMD || "").trim(),
    },
  };
}

function resolvePath(rootPath, inputValue, fallbackValue) {
  if (!inputValue) {
    return fallbackValue;
  }

  return path.isAbsolute(inputValue)
    ? inputValue
    : path.join(rootPath, inputValue);
}

function normalizeApiBaseUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  return trimmed.endsWith("/")
    ? trimmed.slice(0, -1)
    : trimmed;
}

function normalizeBoolean(value, fallbackValue) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallbackValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return !["0", "false", "hayir", "no", "off"].includes(normalized);
}

module.exports = {
  createAppConfig,
};
