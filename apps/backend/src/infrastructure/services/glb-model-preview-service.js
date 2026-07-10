const fs = require("fs");
const path = require("path");

class GlbModelPreviewService {
  async resolveForFolder(folderPath, signals = {}) {
    const normalizedFolderPath = path.resolve(String(folderPath || "").trim());
    if (!normalizedFolderPath || !fs.existsSync(normalizedFolderPath)) {
      return createMissingPreview("3D model klasoru bulunamadi.");
    }

    const candidates = buildCandidateBaseNames(signals);
    if (candidates.length === 0) {
      return createMissingPreview("3D model eslesmesi icin parca kodu veya dosya adi gerekli.");
    }

    const glbFiles = await collectGlbFiles(normalizedFolderPath);
    if (glbFiles.length === 0) {
      return createMissingPreview("Klasorde .glb modeli bulunamadi.");
    }

    const exactMatch = glbFiles.find((filePath) => {
      const baseName = path.basename(filePath, path.extname(filePath)).toUpperCase();
      return candidates.includes(baseName);
    });

    const partialMatch = exactMatch || glbFiles.find((filePath) => {
      const baseName = path.basename(filePath, path.extname(filePath)).toUpperCase();
      return candidates.some((candidate) => baseName.startsWith(candidate) || baseName.includes(candidate));
    });

    if (!partialMatch) {
      return createMissingPreview("Eslesen .glb modeli yuklenmedi.");
    }

    return {
      found: true,
      reason: "",
      folderPath: normalizedFolderPath,
      absolutePath: partialMatch,
      fileName: path.basename(partialMatch),
      relativePath: path.relative(normalizedFolderPath, partialMatch),
      contentType: "model/gltf-binary",
      matchedBy: exactMatch ? "exact-base-name" : "partial-base-name",
      requestedPartCode: String(signals.partCode || "").trim(),
      requestedFileName: String(signals.fileName || "").trim(),
    };
  }
}

function buildCandidateBaseNames(signals) {
  const partCode = sanitizeSignal(signals.partCode);
  const fileName = sanitizeSignal(signals.fileName);
  const effectiveFileName = sanitizeSignal(signals.effectiveFileName);
  const collected = [partCode, fileName, effectiveFileName]
    .filter(Boolean)
    .map((value) => path.basename(value, path.extname(value)).toUpperCase());

  return Array.from(new Set(collected));
}

function sanitizeSignal(value) {
  return String(value || "").trim();
}

async function collectGlbFiles(rootPath) {
  const results = [];

  async function walk(currentPath) {
    const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (path.extname(entry.name).toUpperCase() === ".GLB") {
        results.push(absolutePath);
      }
    }
  }

  await walk(rootPath);
  return results;
}

function createMissingPreview(reason) {
  return {
    found: false,
    reason,
    folderPath: "",
    absolutePath: "",
    fileName: "",
    relativePath: "",
    contentType: "model/gltf-binary",
    matchedBy: "missing",
    requestedPartCode: "",
    requestedFileName: "",
  };
}

module.exports = {
  GlbModelPreviewService,
};
