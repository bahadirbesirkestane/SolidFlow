class WorkflowAutoPlanner {
  constructor({ scanProjectUseCase, workflowTemplateRepository }) {
    this.scanProjectUseCase = scanProjectUseCase;
    this.workflowTemplateRepository = workflowTemplateRepository;
  }

  async buildRequests(folderPath) {
    const [scanResult, templates] = await Promise.all([
      this.scanProjectUseCase.execute(folderPath),
      this.workflowTemplateRepository.listAll(),
    ]);

    const templateMap = new Map(templates.map((template) => [template.id, template]));
    const grouped = new Map();

    for (const row of scanResult.rows) {
      const templateId = pickTemplateId(row);
      if (!templateId) {
        continue;
      }

      const key = `${templateId}::${row.mainGroup || row.folder}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          templateId,
          instanceName: `${row.mainGroup || row.folder} - ${templateMap.get(templateId)?.name || row.suggestedProcess}`,
          itemLabel: row.mainGroup || row.folder,
          itemCount: 0,
          itemPayload: {
            process: row.suggestedProcess,
            serviceType: row.serviceType,
            files: [],
            partCodes: [],
            partList: [],
          },
          assignmentSignals: [],
          stepAssignments: [],
        });
      }

      const group = grouped.get(key);
      group.itemCount += Number(row.quantity || 1);
      group.itemPayload.files.push(row.fileName);
      if (row.partCode) {
        group.itemPayload.partCodes.push(row.partCode);
      }
      group.itemPayload.partList.push({
        partCode: row.partCode || "",
        fileName: row.fileName,
        quantity: Number(row.quantity || 1),
        mainGroup: row.mainGroup || row.folder || "",
        suggestedProcess: row.suggestedProcess,
        serviceType: row.serviceType,
      });
      group.assignmentSignals.push(
        row.fileName,
        row.folder,
        row.mainGroup,
        row.suggestedProcess,
        row.serviceType,
        row.relativePath,
      );
    }

    return Array.from(grouped.values());
  }
}

function pickTemplateId(row) {
  if (row.suggestedProcess === "Satin Alma" || String(row.serviceType || "").includes("Tedarigi")) {
    return "template-procurement-flow";
  }

  if (row.suggestedProcess === "Dis Hizmet" || String(row.serviceType || "").includes("Dis Hizmet") || String(row.serviceType || "").includes("Kesim")) {
    return "template-outsource-part-flow";
  }

  if (["Imalat", "Bukum", "Profil", "Torna/Freze"].includes(row.suggestedProcess)) {
    return "template-production-flow";
  }

  if (["Montaj", "Elektrik"].includes(row.suggestedProcess)) {
    return "template-assembly-flow";
  }

  return null;
}

module.exports = {
  WorkflowAutoPlanner,
  pickTemplateId,
};
