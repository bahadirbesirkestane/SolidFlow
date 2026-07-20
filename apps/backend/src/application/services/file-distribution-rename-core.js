const path = require("path");

const WINDOWS_RESERVED_NAMES = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
]);

async function buildFileDistributionRenamePreview({
  sourceFolder,
  rows,
  selection,
  operation,
  fileRenameAdapter,
}) {
  const normalizedSelection = normalizeSelection(selection);
  const normalizedOperation = normalizeOperation(operation);
  const selectedRows = collectSelectedRows(rows, normalizedSelection);
  const items = await Promise.all(
    selectedRows.map((row) =>
      buildRenameItem({
        row,
        sourceFolder,
        operation: normalizedOperation,
        fileRenameAdapter,
      })
    ),
  );

  markDuplicateTargets(items);

  return {
    operation: normalizedOperation,
    selection: normalizedSelection,
    summary: {
      totalFileCount: rows.length,
      selectedFileCount: normalizedSelection.selectedFilePaths.length,
      selectedFolderCount: normalizedSelection.selectedFolderPaths.length,
      affectedFileCount: items.length,
      changedFileCount: items.filter((item) => item.changed).length,
      validFileCount: items.filter((item) => item.isValid).length,
      invalidFileCount: items.filter((item) => !item.isValid).length,
    },
    items,
  };
}

function normalizeSelection(selection = {}) {
  return {
    selectedFilePaths: dedupeStrings(selection.selectedFilePaths),
    selectedFolderPaths: dedupeStrings(selection.selectedFolderPaths),
    includeSubfolders: Boolean(selection.includeSubfolders),
  };
}

function normalizeOperation(operation = {}) {
  const mode = String(operation.mode || "prefix").trim().toLowerCase();
  return {
    mode: mode === "suffix" ? "suffix" : "prefix",
    text: String(operation.text || ""),
  };
}

function dedupeStrings(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function collectSelectedRows(rows, selection) {
  const selectedFiles = new Set(selection.selectedFilePaths);
  const selectedFolders = new Set(selection.selectedFolderPaths);
  const resultMap = new Map();

  for (const row of rows) {
    if (selectedFiles.has(row.relativePath)) {
      resultMap.set(row.relativePath, row);
      continue;
    }

    const folderPath = extractFolderPath(row.relativePath);
    for (const selectedFolderPath of selectedFolders) {
      if (isRowMatchedByFolderSelection(folderPath, selectedFolderPath, selection.includeSubfolders)) {
        resultMap.set(row.relativePath, row);
        break;
      }
    }
  }

  return Array.from(resultMap.values()).sort((left, right) => left.relativePath.localeCompare(right.relativePath, "tr"));
}

function isRowMatchedByFolderSelection(folderPath, selectedFolderPath, includeSubfolders) {
  if (selectedFolderPath === ".") {
    return includeSubfolders ? true : folderPath === ".";
  }

  if (folderPath === selectedFolderPath) {
    return true;
  }

  return includeSubfolders ? folderPath.startsWith(`${selectedFolderPath}\\`) : false;
}

async function buildRenameItem({ row, sourceFolder, operation, fileRenameAdapter }) {
  const sourcePath = row.absolutePath || path.join(sourceFolder, row.relativePath);
  const folderPath = extractFolderPath(row.relativePath);
  const suggestedName = applyRenameOperation(row.fileName, operation);
  const targetPath = path.join(path.dirname(sourcePath), suggestedName);
  const issues = [];

  if (!operation.text.trim()) {
    issues.push(createIssue("empty_text", "Eklenecek metin bos birakilamaz."));
  }

  if (!suggestedName.trim()) {
    issues.push(createIssue("empty_name", "Yeni dosya adi bos olamaz."));
  }

  const invalidNameReason = validateWindowsFileName(suggestedName);
  if (invalidNameReason) {
    issues.push(createIssue("invalid_name", invalidNameReason));
  }

  if (suggestedName.length > 255) {
    issues.push(createIssue("name_too_long", "Yeni dosya adi Windows sinirini asiyor."));
  }

  if (targetPath.length > 259) {
    issues.push(createIssue("path_too_long", "Yeni dosya yolu Windows sinirini asiyor."));
  }

  const sourceExists = await fileRenameAdapter.exists(sourcePath);
  if (!sourceExists) {
    issues.push(createIssue("source_missing", "Kaynak dosya artik bulunamadi."));
  }

  if (sourceExists) {
    const canWrite = await fileRenameAdapter.canWrite(sourcePath);
    if (!canWrite) {
      issues.push(createIssue("write_denied", "Dosya icin yazma izni bulunamadi."));
    }
  }

  if (sourcePath !== targetPath) {
    const targetExists = await fileRenameAdapter.exists(targetPath);
    if (targetExists) {
      issues.push(createIssue("target_exists", "Ayni klasorde ayni isimde bir dosya zaten mevcut."));
    }
  }

  return {
    relativePath: row.relativePath,
    folderPath,
    sourcePath,
    targetPath,
    originalName: row.fileName,
    suggestedName,
    changed: row.fileName !== suggestedName,
    issues,
    isValid: issues.length === 0,
  };
}

function applyRenameOperation(fileName, operation) {
  const originalName = String(fileName || "");
  const extension = path.extname(originalName);
  const baseName = extension ? originalName.slice(0, originalName.length - extension.length) : originalName;

  if (operation.mode === "suffix") {
    return `${baseName}${operation.text}${extension}`;
  }

  return `${operation.text}${baseName}${extension}`;
}

function validateWindowsFileName(fileName) {
  if (/[<>:"/\\|?*]/.test(fileName)) {
    return "Dosya adinda Windows tarafindan desteklenmeyen karakterler var.";
  }

  if (/[. ]$/.test(fileName)) {
    return "Dosya adi bosluk veya nokta ile bitemez.";
  }

  const extension = path.extname(fileName);
  const baseName = extension ? fileName.slice(0, fileName.length - extension.length) : fileName;
  if (WINDOWS_RESERVED_NAMES.has(baseName.toUpperCase())) {
    return "Yeni dosya adi Windows tarafindan ayrilmis bir isim kullaniyor.";
  }

  return null;
}

function markDuplicateTargets(items) {
  const targetMap = new Map();

  for (const item of items) {
    const key = item.targetPath.toLocaleLowerCase("tr");
    if (!targetMap.has(key)) {
      targetMap.set(key, []);
    }

    targetMap.get(key).push(item);
  }

  for (const duplicates of targetMap.values()) {
    if (duplicates.length <= 1) {
      continue;
    }

    for (const item of duplicates) {
      item.issues.push(createIssue("duplicate_target", "Birden fazla secim ayni yeni dosya adina donusuyor."));
      item.isValid = false;
    }
  }
}

function createIssue(code, message) {
  return {
    code,
    message,
  };
}

function extractFolderPath(relativePath) {
  const segments = String(relativePath || "").split(/[/\\]+/).filter(Boolean);
  if (segments.length <= 1) {
    return ".";
  }

  segments.pop();
  return segments.join("\\");
}

module.exports = {
  buildFileDistributionRenamePreview,
};
