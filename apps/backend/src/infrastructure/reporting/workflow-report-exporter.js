const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

class WorkflowReportExporter {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.pythonPath = resolvePythonPath();
    this.scriptPath = path.join(__dirname, "generate_workflow_report.py");
  }

  async exportWorkbook(reportData) {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "solid-workflow-"));
    const inputPath = path.join(tempDir, "report-input.json");
    const outputPath = path.join(tempDir, "solid-workflow-report.xlsx");

    await fs.promises.writeFile(inputPath, JSON.stringify(reportData), "utf8");

    await execFileAsync(this.pythonPath, [this.scriptPath, inputPath, outputPath], {
      cwd: this.rootPath,
      windowsHide: true,
    });

    const fileBuffer = await fs.promises.readFile(outputPath);
    return {
      fileName: "solid-workflow-report.xlsx",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileBuffer,
    };
  }
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
  WorkflowReportExporter,
};
