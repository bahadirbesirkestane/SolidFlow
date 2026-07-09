const http = require("http");
const fs = require("fs");
const path = require("path");

function createHttpServer({ application, publicDir, defaultScanDir, frontendConfig = {} }) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

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

      const isFrontendRoute = request.method === "GET"
        && !url.pathname.startsWith("/api/")
        && path.extname(url.pathname) === "";

      const filePath = url.pathname === "/" || isFrontendRoute
        ? path.join(publicDir, "index.html")
        : path.join(publicDir, url.pathname);

      if (!filePath.startsWith(publicDir)) {
        sendText(response, 403, "Erisim engellendi.");
        return;
      }

      sendStaticFile(response, filePath);
    } catch (error) {
      sendJson(response, 500, {
        error: "Sunucu hatasi",
        detail: error.message,
      });
    }
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
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(payload);
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

function sendStaticFile(response, filePath) {
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
  };

  fs.access(filePath, fs.constants.F_OK, (error) => {
    if (error) {
      sendText(response, 404, "Dosya bulunamadi.");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

module.exports = {
  createHttpServer,
};
