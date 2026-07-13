const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createHttpServer({ application, reactDistDir, defaultScanDir, frontendConfig = {} }) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const reactBasePath = normalizeFrontendBasePath(frontendConfig.reactBasePath || "/app");
    const reactBuildReady = Boolean(reactDistDir && fs.existsSync(path.join(reactDistDir, "index.html")));

    try {
      if (request.method === "GET" && url.pathname === "/app-config.js") {
        sendText(
          response,
          200,
          `window.APP_CONFIG = ${JSON.stringify({
            apiBaseUrl: frontendConfig.apiBaseUrl || "",
            defaultScanDir: frontendConfig.defaultScanDir || "",
          }, null, 2)};`,
          "application/javascript; charset=utf-8",
        );
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/system/frontend-shell") {
        sendApiSuccess(response, 200, {
          apiBaseUrl: frontendConfig.apiBaseUrl || "",
          defaultScanDir: frontendConfig.defaultScanDir || "",
          legacyPath: "",
          reactBasePath,
          shellMode: "react-only",
          buildReady: reactBuildReady,
        }, {
          contractVersion: "v1",
          responseShape: "data-meta-error",
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/system/select-folder") {
        const payload = await readJsonBody(request);
        const result = await application.selectFolder.execute(payload || {});
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/scan") {
        const requestedFolder = url.searchParams.get("folder");
        const targetFolder = requestedFolder ? path.resolve(requestedFolder) : defaultScanDir;

        const result = await application.scanProject.execute(targetFolder);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/scan/3d-preview") {
        const result = await application.getScanModelPreview.execute(
          path.resolve(url.searchParams.get("folder") || ""),
          {
            partCode: url.searchParams.get("partCode") || "",
            fileName: url.searchParams.get("fileName") || "",
            effectiveFileName: url.searchParams.get("effectiveFileName") || "",
          },
        );
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/scan/3d-model") {
        const preview = await application.streamScanModelPreview.execute(
          path.resolve(url.searchParams.get("folder") || ""),
          {
            partCode: url.searchParams.get("partCode") || "",
            fileName: url.searchParams.get("fileName") || "",
            effectiveFileName: url.searchParams.get("effectiveFileName") || "",
          },
        );
        sendFileStream(response, preview.absolutePath, preview.contentType);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/reports/workflow.xlsx") {
        const requestedFolder = url.searchParams.get("folder");
        const targetFolder = requestedFolder ? path.resolve(requestedFolder) : defaultScanDir;
        const report = await application.exportWorkflowReport.execute(targetFolder);
        sendBinary(response, 200, report.fileBuffer, report.contentType, report.fileName);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/reports/workflow.xlsx") {
        const payload = await readJsonBody(request);
        const report = await application.exportWorkflowReport.execute(defaultScanDir, payload);
        sendBinary(response, 200, report.fileBuffer, report.contentType, report.fileName);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/erp/work-orders") {
        const result = await application.listErpWorkOrders.execute();
        sendJson(response, 200, result);
        return;
      }

      const erpWorkOrderMatch = matchPath(url.pathname, "/api/erp/work-orders/:workOrderId");
      if (request.method === "GET" && erpWorkOrderMatch) {
        const result = await application.getErpWorkOrderDetail.execute(erpWorkOrderMatch.workOrderId);
        sendJson(response, 200, result);
        return;
      }

      const erpStartMatch = matchPath(url.pathname, "/api/erp/work-orders/:workOrderId/start");
      if (request.method === "POST" && erpStartMatch) {
        const result = await application.startErpWorkOrder.execute(erpStartMatch.workOrderId);
        sendJson(response, 201, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/operations/workflow-templates") {
        const result = await application.listWorkflowTemplates.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/operations/users") {
        const result = await application.listUsers.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/operations/users") {
        const payload = await readJsonBody(request);
        const result = await application.createUser.execute(payload);
        sendJson(response, 201, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/operations/open-jobs") {
        const result = await application.listOpenJobs.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/operations/projects") {
        const result = await application.listProjects.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/operations/projects") {
        const payload = await readJsonBody(request);
        const result = await application.createProject.execute(payload);
        sendJson(response, 201, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/operations/projects/bulk-work-orders") {
        const payload = await readJsonBody(request);
        const result = await application.createBulkWorkOrders.execute(payload);
        sendJson(response, 201, result);
        return;
      }

      const projectMatch = matchPath(url.pathname, "/api/operations/projects/:projectId");
      if (request.method === "GET" && projectMatch) {
        const result = await application.getProjectDashboard.execute(projectMatch.projectId);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "DELETE" && projectMatch) {
        const result = await application.deleteProject.execute(projectMatch.projectId);
        sendJson(response, 200, result);
        return;
      }

      const projectAuditMatch = matchPath(url.pathname, "/api/operations/projects/:projectId/audit-events");
      if (request.method === "GET" && projectAuditMatch) {
        const result = await application.listProjectAuditEvents.execute(projectAuditMatch.projectId);
        sendJson(response, 200, result);
        return;
      }

      const projectPreviewMatch = matchPath(url.pathname, "/api/operations/projects/:projectId/3d-preview");
      if (request.method === "GET" && projectPreviewMatch) {
        const result = await application.getProjectModelPreview.execute(projectPreviewMatch.projectId, {
          partCode: url.searchParams.get("partCode") || "",
          fileName: url.searchParams.get("fileName") || "",
          effectiveFileName: url.searchParams.get("effectiveFileName") || "",
        });
        sendJson(response, 200, result);
        return;
      }

      const projectModelMatch = matchPath(url.pathname, "/api/operations/projects/:projectId/3d-model");
      if (request.method === "GET" && projectModelMatch) {
        const preview = await application.streamProjectModelPreview.execute(projectModelMatch.projectId, {
          partCode: url.searchParams.get("partCode") || "",
          fileName: url.searchParams.get("fileName") || "",
          effectiveFileName: url.searchParams.get("effectiveFileName") || "",
        });
        sendFileStream(response, preview.absolutePath, preview.contentType);
        return;
      }

      const projectReportXlsxMatch = matchPath(url.pathname, "/api/operations/projects/:projectId/report.xlsx");
      if (request.method === "GET" && projectReportXlsxMatch) {
        const report = await application.exportProjectOperationsReport.execute(projectReportXlsxMatch.projectId, "xlsx");
        sendBinary(response, 200, report.fileBuffer, report.contentType, report.fileName);
        return;
      }

      const projectReportCsvMatch = matchPath(url.pathname, "/api/operations/projects/:projectId/report.csv");
      if (request.method === "GET" && projectReportCsvMatch) {
        const report = await application.exportProjectOperationsReport.execute(projectReportCsvMatch.projectId, "csv");
        sendBinary(response, 200, report.fileBuffer, report.contentType, report.fileName);
        return;
      }

      const projectReportPdfMatch = matchPath(url.pathname, "/api/operations/projects/:projectId/report.pdf");
      if (request.method === "GET" && projectReportPdfMatch) {
        const report = await application.exportProjectOperationsReport.execute(projectReportPdfMatch.projectId, "pdf");
        sendBinary(response, 200, report.fileBuffer, report.contentType, report.fileName);
        return;
      }

      const projectWorkflowMatch = matchPath(url.pathname, "/api/operations/projects/:projectId/workflow-instances");
      if (request.method === "POST" && projectWorkflowMatch) {
        const payload = await readJsonBody(request);
        const result = await application.createWorkflowInstances.execute(projectWorkflowMatch.projectId, payload);
        sendJson(response, 201, result);
        return;
      }

      const bootstrapMatch = matchPath(url.pathname, "/api/operations/projects/:projectId/bootstrap-workflows");
      if (request.method === "POST" && bootstrapMatch) {
        const payload = await readJsonBody(request);
        const result = await application.bootstrapProjectWorkflows.execute(bootstrapMatch.projectId, payload.folderPath);
        sendJson(response, 201, result);
        return;
      }

      const assignMatch = matchPath(url.pathname, "/api/operations/projects/:projectId/assign-workflows");
      if (request.method === "POST" && assignMatch) {
        const result = await application.assignProjectWorkflows.execute(assignMatch.projectId);
        sendJson(response, 200, result);
        return;
      }

      const advanceMatch = matchPath(url.pathname, "/api/operations/workflow-instances/:instanceId/advance");
      if (request.method === "POST" && advanceMatch) {
        const payload = await readJsonBody(request);
        const result = await application.advanceWorkflowInstance.execute(advanceMatch.instanceId, payload);
        sendJson(response, 200, result);
        return;
      }

      const addStepMatch = matchPath(url.pathname, "/api/operations/workflow-instances/:instanceId/steps");
      if (request.method === "POST" && addStepMatch) {
        const payload = await readJsonBody(request);
        const result = await application.addWorkflowStep.execute(addStepMatch.instanceId, payload);
        sendJson(response, 201, result);
        return;
      }

      const workflowInstanceMatch = matchPath(url.pathname, "/api/operations/workflow-instances/:instanceId");
      if (request.method === "DELETE" && workflowInstanceMatch) {
        const result = await application.deleteWorkflowInstance.execute(workflowInstanceMatch.instanceId);
        sendJson(response, 200, result);
        return;
      }

      const stepMatch = matchPath(url.pathname, "/api/operations/workflow-instance-steps/:stepId");
      if (request.method === "PATCH" && stepMatch) {
        const payload = await readJsonBody(request);
        const result = await application.updateWorkflowStep.execute(stepMatch.stepId, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "DELETE" && stepMatch) {
        const result = await application.removeWorkflowStep.execute(stepMatch.stepId);
        sendJson(response, 200, result);
        return;
      }

      const userMatch = matchPath(url.pathname, "/api/operations/users/:userId");
      if (request.method === "DELETE" && userMatch) {
        const result = await application.deactivateUser.execute(userMatch.userId);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/config/file-types") {
        const result = await application.getFileTypeRules.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "PUT" && url.pathname === "/api/config/file-types") {
        const payload = await readJsonBody(request);
        const result = await application.saveFileTypeRules.execute(payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/config/keyword-rules") {
        const result = await application.getKeywordRules.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "PUT" && url.pathname === "/api/config/keyword-rules") {
        const payload = await readJsonBody(request);
        const result = await application.saveKeywordRules.execute(payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/config/file-name-rules") {
        const result = await application.getFileNameRules.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/config/rule-resolver") {
        const result = await application.getRuleResolverConfig.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "PUT" && url.pathname === "/api/config/file-name-rules") {
        const payload = await readJsonBody(request);
        const result = await application.saveFileNameRules.execute(payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/config/part-overrides") {
        const result = await application.getPartOverrides.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "PUT" && url.pathname === "/api/config/part-overrides") {
        const payload = await readJsonBody(request);
        const result = await application.savePartOverrides.execute(payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/config/assignment-rules") {
        const result = await application.getAssignmentRules.execute();
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "PUT" && url.pathname === "/api/config/assignment-rules") {
        const payload = await readJsonBody(request);
        const result = await application.saveAssignmentRules.execute(payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && isReactFrontendRequest(url.pathname, reactBasePath)) {
        if (!reactDistDir || !fs.existsSync(reactDistDir)) {
          sendText(
            response,
            503,
            "Yeni frontend build edilmemis. Once apps/frontend/app icin build alin.",
          );
          return;
        }

        const reactFilePath = resolveReactFrontendFilePath(url.pathname, reactBasePath, reactDistDir);
        if (!reactFilePath || !reactFilePath.startsWith(reactDistDir)) {
          sendText(response, 403, "Erisim engellendi.");
          return;
        }

        sendStaticFile(request, response, reactFilePath);
        return;
      }

      if (request.method === "GET" && url.pathname === "/") {
        if (reactBuildReady) {
          sendRedirect(response, `${reactBasePath}/operations-center`);
          return;
        }

        sendText(
          response,
          503,
          "Yeni frontend build edilmemis. Once apps/frontend/app icin build alin.",
        );
        return;
      }

      const migratedRouteRedirect = getMigratedRouteRedirect(url.pathname, reactBasePath);
      if (request.method === "GET" && migratedRouteRedirect && reactBuildReady) {
        sendRedirect(response, migratedRouteRedirect);
        return;
      }

      const isFrontendRoute = request.method === "GET"
        && !url.pathname.startsWith("/api/")
        && path.extname(url.pathname) === "";

      if (isFrontendRoute) {
        if (reactBuildReady) {
          sendRedirect(response, `${reactBasePath}/operations-center`);
          return;
        }

        sendText(
          response,
          503,
          "Yeni frontend build edilmemis. Once apps/frontend/app icin build alin.",
        );
        return;
      }

      sendText(response, 404, "Dosya bulunamadi.");
    } catch (error) {
      sendJson(response, 500, {
        error: "Sunucu hatasi",
        detail: error.message,
      });
    }
  });
}

function sendApiSuccess(response, statusCode, data, meta = {}) {
  sendJson(response, statusCode, {
    data,
    meta,
    error: null,
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, payload, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  });
  response.end(payload);
}

function sendRedirect(response, location) {
  response.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  });
  response.end();
}

function sendBinary(response, statusCode, payload, contentType, fileName) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  response.end(payload);
}

function sendFileStream(response, filePath, contentType) {
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  fs.createReadStream(filePath).pipe(response);
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return [];
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function matchPath(pathname, template) {
  const pathSegments = pathname.split("/").filter(Boolean);
  const templateSegments = template.split("/").filter(Boolean);
  if (pathSegments.length !== templateSegments.length) {
    return null;
  }

  const params = {};
  for (let index = 0; index < templateSegments.length; index += 1) {
    const templateSegment = templateSegments[index];
    const pathSegment = pathSegments[index];

    if (templateSegment.startsWith(":")) {
      params[templateSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (templateSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

function sendStaticFile(request, response, filePath) {
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
  };

  fs.stat(filePath, (error, stats) => {
    if (error) {
      sendText(response, 404, "Dosya bulunamadi.");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = contentTypes[extension] || "text/plain; charset=utf-8";
    const cacheControl = extension === ".html"
      ? "no-store, no-cache, must-revalidate, proxy-revalidate"
      : "public, max-age=3600, stale-while-revalidate=86400";
    const headers = {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      Vary: "Accept-Encoding",
      "Last-Modified": stats.mtime.toUTCString(),
    };

    const acceptsEncoding = String(request.headers["accept-encoding"] || "");
    const compressor = createCompressionStream(extension, acceptsEncoding);
    if (!compressor) {
      headers["Content-Length"] = stats.size;
      response.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(response);
      return;
    }

    headers["Content-Encoding"] = compressor.encoding;
    response.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(compressor.stream).pipe(response);
  });
}

function createCompressionStream(extension, acceptsEncoding) {
  const compressibleExtensions = new Set([".html", ".css", ".js", ".json", ".svg", ".txt"]);
  if (!compressibleExtensions.has(extension)) {
    return null;
  }

  if (acceptsEncoding.includes("br")) {
    return {
      encoding: "br",
      stream: zlib.createBrotliCompress(),
    };
  }

  if (acceptsEncoding.includes("gzip")) {
    return {
      encoding: "gzip",
      stream: zlib.createGzip(),
    };
  }

  return null;
}

function isReactFrontendRequest(pathname, reactBasePath) {
  return pathname === reactBasePath || pathname.startsWith(`${reactBasePath}/`);
}

function resolveReactFrontendFilePath(pathname, reactBasePath, reactDistDir) {
  const relativePath = pathname.slice(reactBasePath.length).replace(/^\/+/, "");
  if (!relativePath || path.extname(relativePath) === "") {
    return path.join(reactDistDir, "index.html");
  }

  return path.join(reactDistDir, relativePath);
}

function getMigratedRouteRedirect(pathname, reactBasePath) {
  const routeMap = {
    "/genel-bakis": `${reactBasePath}/dashboard`,
    "/operasyon-merkezi": `${reactBasePath}/operations-center`,
    "/kullanici-is-ekrani": `${reactBasePath}/user-workspace`,
    "/erp-merkezi": `${reactBasePath}/erp-center`,
    "/tarama-ve-is-akisi": `${reactBasePath}/workflow-builder`,
    "/legacy/tarama-ve-is-akisi": `${reactBasePath}/workflow-builder`,
    "/kurallar/dosya-tipleri": `${reactBasePath}/rules`,
    "/kurallar/keyword": `${reactBasePath}/rules`,
    "/kurallar/dosya-adi": `${reactBasePath}/rules`,
    "/kurallar/override": `${reactBasePath}/rules`,
    "/operasyon/acik-isler": `${reactBasePath}/operations-center`,
    "/operasyon/audit": `${reactBasePath}/operations-center`,
    "/operasyon/raporlar": `${reactBasePath}/dashboard`,
    "/legacy/operasyon/acik-isler": `${reactBasePath}/operations-center`,
    "/legacy/operasyon/audit": `${reactBasePath}/operations-center`,
    "/legacy/operasyon/raporlar": `${reactBasePath}/dashboard`,
    "/bilgi/surec-rehberi": `${reactBasePath}/dashboard`,
    "/legacy/bilgi/surec-rehberi": `${reactBasePath}/dashboard`,
    "/yonetim/ekip": `${reactBasePath}/operations-center`,
    "/yonetim/ayarlar": `${reactBasePath}/operations-center`,
    "/yonetim/veri": `${reactBasePath}/operations-center`,
    "/yonetim/onay-kuyrugu": `${reactBasePath}/operations-center`,
    "/yonetim/entegrasyonlar": `${reactBasePath}/operations-center`,
    "/legacy/yonetim/ekip": `${reactBasePath}/operations-center`,
    "/legacy/yonetim/ayarlar": `${reactBasePath}/operations-center`,
    "/legacy/yonetim/veri": `${reactBasePath}/operations-center`,
    "/legacy/yonetim/onay-kuyrugu": `${reactBasePath}/operations-center`,
    "/legacy/yonetim/entegrasyonlar": `${reactBasePath}/operations-center`,
  };

  return routeMap[pathname] || null;
}

function normalizeFrontendBasePath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "/") {
    return "/app";
  }

  return trimmed.endsWith("/")
    ? trimmed.slice(0, -1)
    : trimmed;
}

module.exports = {
  createHttpServer,
};
