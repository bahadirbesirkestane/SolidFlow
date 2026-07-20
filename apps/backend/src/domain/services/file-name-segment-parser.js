const path = require("path");
const { normalizeText } = require("../../shared/text-utils");

const DEFAULT_PRIORITY = [
  "beforeFirstUnderscore",
  "extension",
  "folderName",
  "betweenFirstAndSecondUnderscore",
  "betweenSecondAndThirdUnderscore",
  "betweenThirdAndFourthUnderscore",
  "betweenFourthUnderscoreAndExtension",
];

function parseFileNameSegments(fileDescriptor) {
  const fileName = String(fileDescriptor?.fileName || fileDescriptor?.effectiveFileName || "");
  const folder = String(fileDescriptor?.folder || "");
  const extension = String(fileDescriptor?.extension || path.extname(fileName) || "").replace(/^\./, "").toUpperCase();
  const baseName = path.basename(fileName, path.extname(fileName));
  const parts = baseName.split("_");

  const sourceValues = {
    beforeFirstUnderscore: parts[0] || "",
    extension,
    folderName: normalizeFolderName(folder),
    betweenFirstAndSecondUnderscore: parts[1] || "",
    betweenSecondAndThirdUnderscore: parts[2] || "",
    betweenThirdAndFourthUnderscore: parts[3] || "",
    betweenFourthUnderscoreAndExtension: parts.slice(4).join("_") || "",
  };

  return {
    fileName,
    baseName,
    parts,
    sourceValues,
    normalizedSourceValues: Object.fromEntries(
      Object.entries(sourceValues).map(([key, value]) => [key, normalizeText(value)]),
    ),
  };
}

function resolvePriorityValues(parsedSegments, priority = DEFAULT_PRIORITY) {
  return priority
    .map((key) => ({
      key,
      value: parsedSegments.sourceValues[key] || "",
      normalizedValue: parsedSegments.normalizedSourceValues[key] || "",
    }))
    .filter((entry) => Boolean(entry.normalizedValue));
}

function normalizeFolderName(folder) {
  const segments = String(folder || "").split(/[/\\]+/).filter(Boolean);
  return segments.at(-1) || "";
}

module.exports = {
  DEFAULT_PRIORITY,
  parseFileNameSegments,
  resolvePriorityValues,
};
