const path = require("path");
const folderProcessRules = require("../constants/folder-process-rules");
const { parseSolidFileDescriptor } = require("./solid-file-name-parser");
const { normalizePath, normalizeText } = require("../../shared/text-utils");

class WorkflowEngine {
  resolve(fileDescriptor, configuration) {
    const fileTypeRule = configuration.fileTypeRules.find(
      (rule) => rule.extension === fileDescriptor.extension && rule.isActive,
    );

    const baseClassification = {
      fileType: fileTypeRule ? fileTypeRule.displayName : "Diger",
      process: fileTypeRule ? fileTypeRule.defaultProcess : "Belirsiz",
      serviceType: fileTypeRule ? fileTypeRule.defaultServiceType : "Belirsiz",
      confidence: fileTypeRule ? "Varsayilan" : "Belirsiz",
      matchedBy: fileTypeRule ? "Dosya Tipi" : "Kural Yok",
    };

    const overrideMatch = this.matchPartOverride(fileDescriptor, configuration.partOverrides);
    if (overrideMatch) {
      return {
        ...baseClassification,
        process: overrideMatch.process || baseClassification.process,
        serviceType: overrideMatch.serviceType || baseClassification.serviceType,
        confidence: "Manuel",
        matchedBy: `Parca Override (${overrideMatch.matchMode})`,
      };
    }

    const fileNameRuleClassification = this.matchFileNameRuleClassification(fileDescriptor);
    if (fileNameRuleClassification) {
      return {
        ...baseClassification,
        process: fileNameRuleClassification.process || baseClassification.process,
        serviceType: fileNameRuleClassification.serviceType || baseClassification.serviceType,
        confidence: "Kural",
        matchedBy: `Dosya Adi Kurali (${fileNameRuleClassification.name})`,
      };
    }

    const folderMatch = this.matchFolderRule(fileDescriptor.relativePath);
    if (folderMatch) {
      return {
        ...baseClassification,
        process: folderMatch.process,
        serviceType: folderMatch.serviceType || baseClassification.serviceType,
        confidence: "Kesin",
        matchedBy: "Klasor Kurali",
      };
    }

    const parsedProcessHint = this.matchParsedProcessHint(fileDescriptor);
    if (parsedProcessHint) {
      return {
        ...baseClassification,
        process: parsedProcessHint.process,
        serviceType: parsedProcessHint.serviceType || baseClassification.serviceType,
        confidence: "Tahmini",
        matchedBy: `Dosya Adi Ayristirma (${parsedProcessHint.label})`,
      };
    }

    const keywordMatch = this.matchKeywordRule(fileDescriptor, configuration.keywordRules);
    if (keywordMatch) {
      return {
        ...baseClassification,
        process: keywordMatch.process,
        serviceType: keywordMatch.serviceType || baseClassification.serviceType,
        confidence: "Tahmini",
        matchedBy: `Anahtar Kelime (${keywordMatch.keyword})`,
      };
    }

    if (!fileTypeRule && fileDescriptor.extension === ".SLDASM") {
      return {
        ...baseClassification,
        fileType: "Montaj",
        process: "Montaj",
        serviceType: "Montaj",
        confidence: "Tahmini",
        matchedBy: "Dosya Tipi Fallback",
      };
    }

    return baseClassification;
  }

  matchFolderRule(relativePath) {
    const normalizedRelativePath = normalizePath(relativePath);
    return folderProcessRules.find((rule) => normalizedRelativePath.includes(rule.pattern)) || null;
  }

  matchParsedProcessHint(fileDescriptor) {
    const processHints = Array.isArray(fileDescriptor.parsedName?.processHints)
      ? fileDescriptor.parsedName.processHints
      : [];

    return processHints[0] || null;
  }

  matchKeywordRule(fileDescriptor, keywordRules) {
    const fileNameCandidates = [
      fileDescriptor.fileName,
      fileDescriptor.effectiveFileName,
    ].filter(Boolean).map((value) => normalizeText(value));
    const normalizedPathValue = normalizePath(fileDescriptor.relativePath);

    for (const rule of keywordRules) {
      if (!rule.isActive) {
        continue;
      }

      const targetValues = rule.matchTarget === "path" ? [normalizedPathValue] : fileNameCandidates;
      if (targetValues.some((value) => value.includes(normalizeText(rule.keyword)))) {
        return rule;
      }
    }

    return null;
  }

  matchPartOverride(fileDescriptor, partOverrides) {
    for (const override of partOverrides) {
      if (!override.isActive) {
        continue;
      }

      if (override.matchMode === "partCode" && override.partCode && override.partCode === fileDescriptor.partCode) {
        return override;
      }

      if (override.matchMode === "fileName" && override.fileName) {
        const candidateNames = [fileDescriptor.fileName, fileDescriptor.effectiveFileName]
          .filter(Boolean)
          .map((value) => normalizeText(value));

        if (candidateNames.includes(normalizeText(override.fileName))) {
          return override;
        }
      }
    }

    return null;
  }

  matchFileNameRuleClassification(fileDescriptor) {
    const rule = fileDescriptor.fileNameRuleMatch?.rule;
    if (!rule) {
      return null;
    }

    if (!rule.process && !rule.serviceType) {
      return null;
    }

    return rule;
  }
}

function extractPartCode(fileName) {
  return parseSolidFileDescriptor({ fileName }).partCode;
}

function inferMainGroup(relativePath) {
  const segments = relativePath.split(path.sep).filter(Boolean);
  if (segments.length <= 1) {
    return "";
  }

  if (normalizeText(segments[0]) === "200_TEKNIK RESIM" && segments[1]) {
    return segments[1];
  }

  return segments[0];
}

module.exports = {
  WorkflowEngine,
  extractPartCode,
  inferMainGroup,
};
