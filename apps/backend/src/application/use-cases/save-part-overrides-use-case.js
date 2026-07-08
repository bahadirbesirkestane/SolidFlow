const { toSlug } = require("../../shared/text-utils");

class SavePartOverridesUseCase {
  constructor({ partOverrideRepository }) {
    this.partOverrideRepository = partOverrideRepository;
  }

  async execute(overrides) {
    const sanitizedOverrides = overrides
      .map((override) => ({
      id: override.id || createOverrideId(override),
      matchMode: override.matchMode === "fileName" ? "fileName" : "partCode",
      partCode: String(override.partCode || "").trim(),
      fileName: String(override.fileName || "").trim(),
      process: String(override.process || "").trim(),
      serviceType: String(override.serviceType || "").trim(),
      note: String(override.note || "").trim(),
      isActive: Boolean(override.isActive),
      }))
      .filter((override) => {
        if (!override.process || !override.serviceType) {
          return false;
        }

        return override.matchMode === "fileName"
          ? Boolean(override.fileName)
          : Boolean(override.partCode);
      });

    return this.partOverrideRepository.saveAll(sanitizedOverrides);
  }
}

function createOverrideId(override) {
  return `override-${toSlug(override.partCode || override.fileName || Date.now())}`;
}

module.exports = {
  SavePartOverridesUseCase,
};
