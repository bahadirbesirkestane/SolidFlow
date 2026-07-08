const path = require("path");
const { normalizeText } = require("../../shared/text-utils");

const MATERIAL_HINT_PATTERNS = [
  { label: "Sac", patterns: ["SAC"] },
  { label: "Profil", patterns: ["PROFIL"] },
  { label: "Boru", patterns: ["BORU"] },
  { label: "Mil", patterns: ["MIL"] },
  { label: "Paslanmaz", patterns: ["PASLANMAZ"] },
  { label: "Aluminyum", patterns: ["AL", "ALUMINYUM"], exactTokenOnly: true },
  { label: "Kaucuk", patterns: ["KAUCUK"] },
  { label: "Bant", patterns: ["BANT"] },
  { label: "Kestamit", patterns: ["KESTAMIT"] },
];

const PROCESS_HINT_PATTERNS = [
  {
    label: "Montaj",
    process: "Montaj",
    serviceType: "Montaj",
    patterns: ["MONTAJ"],
  },
  {
    label: "Elektrik",
    process: "Elektrik",
    serviceType: "Elektrik",
    patterns: ["ENCODER", "LOADCELL"],
  },
];

function parseSolidFileDescriptor(fileDescriptor) {
  const fileName = String(fileDescriptor?.fileName || "");
  const relativePath = String(fileDescriptor?.relativePath || "");
  const extension = String(fileDescriptor?.extension || path.extname(fileName) || "").toUpperCase();
  const baseName = path.basename(fileName, path.extname(fileName));
  const normalizedBaseName = normalizeText(baseName);
  const normalizedRelativePath = normalizeText(relativePath);
  const tokens = tokenize(baseName);
  const partCode = findPartCode(tokens, normalizedBaseName);
  const quantity = findQuantity(normalizedBaseName);
  const revision = findRevision(tokens, normalizedBaseName);
  const variant = findVariant(tokens, normalizedBaseName, { partCode, revision, quantity });
  const materialHints = collectHints(tokens, normalizedBaseName, MATERIAL_HINT_PATTERNS);
  const processHints = collectProcessHints(tokens, normalizedBaseName);

  return {
    baseName,
    extension,
    normalizedBaseName,
    normalizedRelativePath,
    tokens,
    partCode,
    quantity,
    revision,
    variant,
    isMirrored: normalizedBaseName.includes("AYNALAMA"),
    materialHints,
    processHints,
  };
}

function tokenize(input) {
  return normalizeText(input)
    .split(/[^A-Z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function findPartCode(tokens, normalizedBaseName) {
  const tokenMatch = tokens.find((token) => /^\d{2,}$/.test(token));
  if (tokenMatch) {
    return tokenMatch;
  }

  const embeddedTokenMatch = tokens
    .map((token) => token.match(/^[A-Z]+(\d{2,})$/))
    .find(Boolean);
  if (embeddedTokenMatch) {
    return embeddedTokenMatch[1];
  }

  const prefixMatch = normalizedBaseName.match(/^(\d{2,})/);
  return prefixMatch ? prefixMatch[1] : "";
}

function findQuantity(normalizedBaseName) {
  const quantityMatch = normalizedBaseName.match(/(?:^|[^0-9])(\d+)\s*ADET(?:$|[^A-Z0-9])/);
  return quantityMatch ? Number(quantityMatch[1]) : null;
}

function findRevision(tokens, normalizedBaseName) {
  const revisionToken = tokens.find((token) => /^R\d+$/.test(token) || /^REV\d+$/.test(token));
  if (revisionToken) {
    return revisionToken.replace(/^REV/, "R");
  }

  const revisionMatch = normalizedBaseName.match(/(?:^|[^A-Z0-9])(R\d+)(?:$|[^A-Z0-9])/);
  return revisionMatch ? revisionMatch[1] : "";
}

function findVariant(tokens, normalizedBaseName, context) {
  if (normalizedBaseName.includes("AYNALAMA")) {
    return "Aynalama";
  }

  const numericTailIndex = findNumericVariantIndex(tokens);
  if (numericTailIndex < 0) {
    return "";
  }

  const numericTail = tokens[numericTailIndex];
  if (!numericTail) {
    return "";
  }

  if (numericTail === context.partCode) {
    return "";
  }

  if (context.quantity !== null && Number(numericTail) === context.quantity) {
    return "";
  }

  if (context.revision && numericTail === context.revision.replace(/^R/, "")) {
    return "";
  }

  return numericTail;
}

function collectHints(tokens, normalizedBaseName, patterns) {
  return patterns
    .filter((item) => item.patterns.some((pattern) => hasTokenOrPhrase(tokens, normalizedBaseName, pattern, item.exactTokenOnly)))
    .map((item) => item.label);
}

function collectProcessHints(tokens, normalizedBaseName) {
  return PROCESS_HINT_PATTERNS
    .filter((item) => item.patterns.some((pattern) => hasTokenOrPhrase(tokens, normalizedBaseName, pattern)))
    .map((item) => ({
      label: item.label,
      process: item.process,
      serviceType: item.serviceType,
    }));
}

function findNumericVariantIndex(tokens) {
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    if (!/^\d+$/.test(tokens[index])) {
      continue;
    }

    if (tokens[index + 1] === "ADET" || tokens[index + 1] === "MM") {
      continue;
    }

    return index;
  }

  return -1;
}

function hasTokenOrPhrase(tokens, normalizedBaseName, pattern, exactTokenOnly = false) {
  const normalizedPattern = normalizeText(pattern);
  if (tokens.includes(normalizedPattern)) {
    return true;
  }

  if (exactTokenOnly) {
    return false;
  }

  return normalizedBaseName.includes(normalizedPattern);
}

module.exports = {
  parseSolidFileDescriptor,
};
