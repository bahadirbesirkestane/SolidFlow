class SaveFileDistributionConfigUseCase {
  constructor({ fileDistributionConfigRepository }) {
    this.fileDistributionConfigRepository = fileDistributionConfigRepository;
  }

  async execute(payload = {}) {
    const normalized = {
      segmentPriority: sanitizeSegmentPriority(payload.segmentPriority),
      unresolvedFolderName: String(payload.unresolvedFolderName || "_BELIRSIZ").trim() || "_BELIRSIZ",
      categoryRules: sanitizeCategoryRules(payload.categoryRules),
    };

    return this.fileDistributionConfigRepository.save(normalized);
  }
}

const ALLOWED_SEGMENTS = new Set([
  "beforeFirstUnderscore",
  "extension",
  "folderName",
  "betweenFirstAndSecondUnderscore",
  "betweenSecondAndThirdUnderscore",
  "betweenThirdAndFourthUnderscore",
  "betweenFourthUnderscoreAndExtension",
]);

function sanitizeSegmentPriority(values) {
  const rawValues = Array.isArray(values) ? values : [];
  const unique = [];
  for (const value of rawValues) {
    const normalized = String(value || "").trim();
    if (!ALLOWED_SEGMENTS.has(normalized) || unique.includes(normalized)) {
      continue;
    }
    unique.push(normalized);
  }

  if (unique.length === 0) {
    return Array.from(ALLOWED_SEGMENTS);
  }

  return unique;
}

function sanitizeCategoryRules(values) {
  return (Array.isArray(values) ? values : [])
    .map((rule, index) => ({
      id: String(rule.id || `distribution-rule-${index + 1}`).trim() || `distribution-rule-${index + 1}`,
      name: String(rule.name || "").trim(),
      matchMode: rule.matchMode === "all" ? "all" : "any",
      keywords: (Array.isArray(rule.keywords) ? rule.keywords : [])
        .map((keyword) => String(keyword || "").trim())
        .filter(Boolean),
      segmentMatchers: sanitizeSegmentMatchers(rule.segmentMatchers),
      category: String(rule.category || "").trim(),
      subcategory: String(rule.subcategory || "").trim(),
      renamePrefix: String(rule.renamePrefix || "").trim(),
      isCopyCandidate: rule.isCopyCandidate !== false,
      confidence: String(rule.confidence || "Orta").trim() || "Orta",
      priority: Number(rule.priority || 0),
      note: String(rule.note || "").trim(),
      isActive: rule.isActive !== false,
    }))
    .filter((rule) => rule.name && rule.category && rule.subcategory && (rule.keywords.length > 0 || rule.segmentMatchers.length > 0));
}

function sanitizeSegmentMatchers(values) {
  return (Array.isArray(values) ? values : [])
    .map((matcher) => {
      const segmentKey = String(matcher?.segmentKey || "").trim();
      const operator = String(matcher?.operator || "contains").trim();
      return {
        segmentKey,
        operator: ["contains", "equals", "startsWith"].includes(operator) ? operator : "contains",
        value: String(matcher?.value || "").trim(),
      };
    })
    .filter((matcher) => ALLOWED_SEGMENTS.has(matcher.segmentKey) && matcher.value);
}

module.exports = {
  SaveFileDistributionConfigUseCase,
};
