const { parseFileNameSegments, resolvePriorityValues, DEFAULT_PRIORITY } = require("./file-name-segment-parser");
const { normalizeText } = require("../../shared/text-utils");

class FileDistributionRuleEngine {
  resolve(row, config = {}) {
    const parsedSegments = parseFileNameSegments(row);
    const priority = Array.isArray(config.segmentPriority) && config.segmentPriority.length > 0
      ? config.segmentPriority
      : DEFAULT_PRIORITY;
    const priorityValues = resolvePriorityValues(parsedSegments, priority);
    const sourceBag = buildSourceBag(row, priorityValues);

    const decision = resolveConfiguredRule(sourceBag, config.categoryRules)
      || decideDistributionTarget(row, sourceBag, config);

    return {
      parsedSegments,
      priorityValues,
      ...decision,
    };
  }
}

function resolveConfiguredRule(sourceBag, categoryRules = []) {
  const activeRules = (Array.isArray(categoryRules) ? categoryRules : [])
    .filter((rule) => rule?.isActive)
    .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0));

  for (const rule of activeRules) {
    const keywords = Array.isArray(rule.keywords) ? rule.keywords : [];
    const segmentMatchers = Array.isArray(rule.segmentMatchers) ? rule.segmentMatchers : [];
    if (keywords.length === 0 && segmentMatchers.length === 0) {
      continue;
    }

    const conditions = [
      ...keywords.map((keyword) => ({
        type: "keyword",
        label: String(keyword || "").trim(),
        matched: sourceBag.searchText.includes(String(keyword || "").trim().toUpperCase()),
      })).filter((condition) => condition.label),
      ...segmentMatchers.map((matcher) => buildSegmentCondition(matcher, sourceBag.segmentValues)).filter(Boolean),
    ];

    if (conditions.length === 0) {
      continue;
    }

    const matched = rule.matchMode === "all"
      ? conditions.every((condition) => condition.matched)
      : conditions.some((condition) => condition.matched);

    if (!matched) {
      continue;
    }

    return buildDecision(rule.category, rule.subcategory, {
      reason: rule.note || `${rule.name || "Dagitim kurali"} eslesti: ${conditions.filter((condition) => condition.matched).map((condition) => condition.label).join(", ")}`,
      confidence: rule.confidence || "Orta",
      isCopyCandidate: rule.isCopyCandidate !== false,
      renamePrefix: rule.renamePrefix || "",
    });
  }

  return null;
}

function decideDistributionTarget(row, sourceBag, config) {
  const contains = (keyword) => sourceBag.searchText.includes(keyword);
  const isExternal = contains("DIS HIZMET")
    || contains("SATIN ALMA")
    || contains("TASERON")
    || contains("MALZEMECI");
  const highConfidence = row.confidence && row.confidence !== "Belirsiz";

  if (contains("PROFIL") || contains("BORU")) {
    return buildDecision("Profil Lazer", "Profil", {
      reason: "Profil veya boru ifadesi tespit edildi.",
      confidence: highConfidence ? "Yuksek" : "Orta",
      isCopyCandidate: true,
      renamePrefix: "PRF",
    });
  }

  if (contains("SAC") || contains("BUKUM")) {
    return buildDecision("Sac Malzeme", contains("BUKUM") ? "Bukumlu" : "Duz", {
      reason: "Sac veya bukum ifadesi tespit edildi.",
      confidence: highConfidence ? "Yuksek" : "Orta",
      isCopyCandidate: true,
      renamePrefix: "SAC",
    });
  }

  if (contains("MIL") || contains("TORNA") || contains("FREZE")) {
    return buildDecision("Yatay Cnc (Torna)", isExternal ? "Dis Hizmet" : "Ic Hizmet", {
      reason: "Mil, torna veya freze ifadesi tespit edildi.",
      confidence: highConfidence ? "Yuksek" : "Orta",
      isCopyCandidate: true,
      renamePrefix: "YCN",
    });
  }

  if (contains("MALZEME") || contains("SATIN ALMA") || contains("NALBUR")) {
    return buildDecision("Hazir Malzeme", contains("NALBUR") ? "Nalbur vs" : "Malzemeci", {
      reason: "Hazir malzeme sinifi ile uyumlu ifade tespit edildi.",
      confidence: highConfidence ? "Yuksek" : "Orta",
      isCopyCandidate: true,
      renamePrefix: "HZR",
    });
  }

  if (contains("STEP") || contains("DXF") || contains("SLDPRT") || contains("CNC") || contains("KESIM")) {
    return buildDecision("Dikey Cnc", isExternal ? "Dis Hizmet" : "Ic Hizmet", {
      reason: "CNC veya kesim odakli ifade tespit edildi.",
      confidence: highConfidence ? "Orta" : "Dusuk",
      isCopyCandidate: true,
      renamePrefix: "DCN",
    });
  }

  const unresolvedFolder = String(config.unresolvedFolderName || "_BELIRSIZ").trim() || "_BELIRSIZ";
  return buildDecision(unresolvedFolder, "Incelenecek", {
    reason: "Net bir dagitim hedefi tespit edilemedi.",
    confidence: "Dusuk",
    isCopyCandidate: false,
    renamePrefix: "CHK",
  });
}

function buildSourceBag(row, priorityValues) {
  const segmentValues = Object.fromEntries(priorityValues.map((entry) => [entry.key, entry]));
  const tokens = [
    row.fileName,
    row.effectiveFileName,
    row.folder,
    row.mainGroup,
    row.suggestedProcess,
    row.serviceType,
    row.matchedBy,
    ...(Array.isArray(row.materialHints) ? row.materialHints : []),
    ...(Array.isArray(row.processHints) ? row.processHints.map((item) => item.label || item.process || "") : []),
    ...priorityValues.map((entry) => entry.value),
  ];

  return {
    searchText: tokens.join(" ").toUpperCase(),
    segmentValues,
  };
}

function buildSegmentCondition(matcher, segmentValues) {
  const segmentKey = String(matcher?.segmentKey || "").trim();
  const value = String(matcher?.value || "").trim();
  if (!segmentKey || !value) {
    return null;
  }

  const operator = String(matcher?.operator || "contains");
  const segmentValue = segmentValues[segmentKey]?.normalizedValue || "";
  const expectedValue = normalizeText(value);
  const matched = operator === "equals"
    ? segmentValue === expectedValue
    : operator === "startsWith"
      ? segmentValue.startsWith(expectedValue)
      : segmentValue.includes(expectedValue);

  return {
    type: "segment",
    label: `${segmentKey} ${operator} ${value}`,
    matched,
  };
}

function buildDecision(category, subcategory, details) {
  return {
    category,
    subcategory,
    confidence: details.confidence,
    reason: details.reason,
    isCopyCandidate: details.isCopyCandidate,
    renamePrefix: details.renamePrefix,
  };
}

module.exports = {
  FileDistributionRuleEngine,
};
