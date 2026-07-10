const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const SUPPORTED_SOLID_EXTENSIONS = new Set([".SLDPRT", ".SLDASM"]);

class CadConversionService {
  constructor({ rootPath, config = {}, logger = console } = {}) {
    this.rootPath = rootPath;
    this.config = {
      enabled: config.enabled === true,
      timeoutMs: Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 180000,
      converterExecutable: String(config.converterExecutable || "").trim(),
    };
    this.logger = logger;
    this.scriptPath = path.join(__dirname, "convert-solid-to-glb.py");
    this.pythonPath = resolvePythonPath();
    this.activeTasks = new Map();
  }

  scheduleMissingConversions(scanRootPath, fileDescriptors = []) {
    if (!this.config.enabled || !Array.isArray(fileDescriptors) || fileDescriptors.length === 0) {
      return;
    }

    const jobs = fileDescriptors
      .filter((fileDescriptor) => isSupportedSolidFile(fileDescriptor.absolutePath))
      .map((fileDescriptor) => this.enqueueConversionForFile(fileDescriptor.absolutePath, {
        scanRootPath,
        relativePath: fileDescriptor.relativePath,
      }).catch(() => {}));

    Promise.allSettled(jobs).catch(() => {});
  }

  async enqueueConversionForFile(sourcePath, context = {}) {
    if (!this.config.enabled) {
      return { queued: false, reason: "disabled" };
    }

    const normalizedSourcePath = path.resolve(String(sourcePath || ""));
    if (!isSupportedSolidFile(normalizedSourcePath)) {
      return { queued: false, reason: "unsupported" };
    }

    const outputPath = this.resolveOutputPath(normalizedSourcePath);
    if (await fileExists(outputPath)) {
      return { queued: false, reason: "exists", outputPath };
    }

    const taskKey = `${normalizedSourcePath}::${outputPath}`;
    if (this.activeTasks.has(taskKey)) {
      return { queued: false, reason: "in_progress", outputPath };
    }

    const taskPromise = this.runConversionTask({
      sourcePath: normalizedSourcePath,
      outputPath,
      context,
    })
      .catch(() => {})
      .finally(() => {
        this.activeTasks.delete(taskKey);
      });

    this.activeTasks.set(taskKey, taskPromise);
    return { queued: true, outputPath };
  }

  resolveOutputPath(sourcePath) {
    const sourceDirectory = path.dirname(sourcePath);
    const sourceBaseName = path.basename(sourcePath, path.extname(sourcePath));
    return path.join(sourceDirectory, `${sourceBaseName}.glb`);
  }

  async runConversionTask({ sourcePath, outputPath }) {
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    const attempts = buildRunnerAttempts({
      converterExecutable: this.config.converterExecutable,
      pythonPath: this.pythonPath,
      scriptPath: this.scriptPath,
      sourcePath,
      outputPath,
    });

    let lastError = null;
    for (const attempt of attempts) {
      try {
        await execFileAsync(attempt.command, attempt.args, {
          cwd: this.rootPath,
          windowsHide: true,
          timeout: this.config.timeoutMs,
        });

        if (await fileExists(outputPath)) {
          return;
        }

        lastError = new Error("Donusturucu calisti ancak .glb cikti dosyasi uretmedi.");
      } catch (error) {
        lastError = error;
      }
    }

    throw wrapConversionError(lastError, sourcePath, outputPath);
  }
}

function buildRunnerAttempts({ converterExecutable, pythonPath, scriptPath, sourcePath, outputPath }) {
  const commandCandidates = [
    converterExecutable,
    process.env.FREECAD_CMD,
    "FreeCADCmd.exe",
    "freecadcmd",
    pythonPath,
  ]
    .map((candidate) => String(candidate || "").trim())
    .filter(Boolean);

  const uniqueCandidates = Array.from(new Set(commandCandidates));

  return uniqueCandidates.map((command) => ({
    command,
    args: [scriptPath, sourcePath, outputPath],
  }));
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

function isSupportedSolidFile(filePath) {
  return SUPPORTED_SOLID_EXTENSIONS.has(path.extname(String(filePath || "")).toUpperCase());
}

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function wrapConversionError(error, sourcePath, outputPath) {
  const detail = error?.message || "Bilinmeyen donusum hatasi";
  return new Error(`SolidWorks dosyasi .glb formatina donusturulemedi. Kaynak: ${sourcePath} | Hedef: ${outputPath} | Detay: ${detail}`);
}

module.exports = {
  CadConversionService,
};
