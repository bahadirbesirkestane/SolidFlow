const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

class OperationsReportExporter {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.pythonPath = resolvePythonPath();
    this.scriptPath = path.join(__dirname, "generate_operations_report.py");
  }

  async exportWorkbook(reportData) {
    return this.exportViaPython(reportData, "xlsx", "operations-workflow-report.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  async exportPdf(reportData) {
    return this.exportViaPython(reportData, "pdf", "operations-workflow-report.pdf", "application/pdf");
  }

  async exportViaPython(reportData, format, fileName, contentType) {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "solid-operations-"));
    const inputPath = path.join(tempDir, "operations-report-input.json");
    const outputPath = path.join(tempDir, `operations-report.${format}`);

    await fs.promises.writeFile(inputPath, JSON.stringify(reportData), "utf8");

    await execFileAsync(this.pythonPath, [this.scriptPath, inputPath, outputPath, format], {
      cwd: this.rootPath,
      windowsHide: true,
    });

    const fileBuffer = await fs.promises.readFile(outputPath);
    return {
      fileName,
      contentType,
      fileBuffer,
    };
  }

  async exportCsv(reportData) {
    const lines = [];
    const pushSection = (label) => {
      lines.push([label]);
    };

    lines.push(["Proje Kodu", "Proje Adi", "Aciklama", "Toplam Workflow", "Toplam Adim", "Tamamlanan Adim", "Ilerleme Yuzdesi", "Rapor Tarihi"]);
    lines.push([
      reportData.project.code,
      reportData.project.name,
      reportData.project.description || "",
      String(reportData.progress.totalInstances || 0),
      String(reportData.progress.totalSteps || 0),
      String(reportData.progress.completedSteps || 0),
      `%${reportData.progress.completionPercentage || 0}`,
      reportData.generatedAt,
    ]);

    lines.push([]);
    pushSection("Workflow Adimlari");
    lines.push([
      "Workflow",
      "Kalem",
      "Workflow Durumu",
      "Workflow Ilerleme",
      "Sira",
      "Adim",
      "Atananlar",
      "Durum",
      "Opsiyonel",
      "Onaylayan",
      "Devir",
      "Not",
      "Tamamlanma",
    ]);

    for (const workflow of reportData.workflows) {
      for (const step of workflow.steps) {
        lines.push([
          workflow.name,
          workflow.itemLabel || "",
          workflow.status,
          `%${workflow.progressPercent}`,
          String(step.sequenceNo),
          step.name,
          (step.assigneeIds || []).join(", ") || step.assignee || "",
          step.status,
          step.isOptional ? "Evet" : "Hayir",
          step.approvedBy || "",
          step.handoverTo || "",
          step.completionNote || "",
          step.completedAt || "",
        ]);
      }
    }

    lines.push([]);
    pushSection("Acik Isler");
    lines.push(["Baslik", "Durum", "Kaynak", "Aciklama", "Olusturulma"]);
    for (const job of reportData.openJobs) {
      lines.push([
        job.title,
        job.status,
        job.sourceType,
        job.description || "",
        job.createdAt || "",
      ]);
    }

    lines.push([]);
    pushSection("Audit Kayitlari");
    lines.push(["Tarih", "Islem", "Varlik Tipi", "Varlik Id", "Ozet"]);
    for (const event of reportData.auditEvents) {
      lines.push([
        event.createdAt || "",
        event.action,
        event.entityType,
        event.entityId,
        summarizePayload(event.payload),
      ]);
    }

    const csv = lines.map((row) => row.map(escapeCsvCell).join(";")).join("\n");
    return {
      fileName: "operations-workflow-report.csv",
      contentType: "text/csv; charset=utf-8",
      fileBuffer: Buffer.from(`\uFEFF${csv}`, "utf8"),
    };
  }
}

function summarizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return Object.entries(payload)
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join(" | ");
}

function escapeCsvCell(value) {
  const text = String(value || "");
  if (/[;"\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function resolvePythonPath() {
  const candidates = [
    process.env.SOLID_WORKFLOW_PYTHON,
    "C:\\Users\\O M E N\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
    "python",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (candidate === "python" || fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (error) {
      continue;
    }
  }

  return "python";
}

module.exports = {
  OperationsReportExporter,
};
