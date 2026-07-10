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
      const route = resolveWorkflowRoute(row);
      const templateId = route.templateId;
      if (!templateId) {
        continue;
      }

      const groupingLabel = route.groupingLabel;
      const key = `${templateId}::${groupingLabel}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          templateId,
          instanceName: buildInstanceName(route, row, templateMap.get(templateId)?.name || row.suggestedProcess),
          itemLabel: buildItemLabel(route, row),
          itemCount: 0,
          itemPayload: {
            process: row.suggestedProcess,
            serviceType: row.serviceType,
            files: [],
            partCodes: [],
            partList: [],
            routing: {
              templateId,
              strategyName: row.routingRule?.name || "",
              groupMode: row.routingRule?.flowGroupMode || "",
              groupValue: row.routingRule?.flowGroupValue || "",
            },
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
        mainGroup: groupingLabel,
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
  if (row.routingRule?.workflowTemplateId) {
    return row.routingRule.workflowTemplateId;
  }

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

function resolveWorkflowRoute(row) {
  const templateId = pickTemplateId(row);
  return {
    templateId,
    groupingLabel: resolveGroupingLabel(row),
  };
}

function resolveGroupingLabel(row) {
  const mode = row.routingRule?.flowGroupMode || "auto";
  const fixedValue = String(row.routingRule?.flowGroupValue || "").trim();

  if (mode === "fixed" && fixedValue) {
    return fixedValue;
  }

  if (mode === "partCode" && row.partCode) {
    return row.partCode;
  }

  if (mode === "folder" && row.folder) {
    return row.folder;
  }

  if (mode === "fileName" && row.fileName) {
    return row.fileName;
  }

  if (mode === "mainGroup" && row.mainGroup) {
    return row.mainGroup;
  }

  return row.mainGroup || row.folder || row.partCode || row.fileName || "Genel";
}

function buildItemLabel(route, row) {
  const template = String(row.routingRule?.itemLabelTemplate || "").trim();
  if (!template) {
    return route.groupingLabel;
  }

  return applyLabelTemplate(template, row, route.groupingLabel);
}

function buildInstanceName(route, row, templateName) {
  const itemLabel = buildItemLabel(route, row);
  return `${itemLabel} - ${templateName}`;
}

function applyLabelTemplate(template, row, groupingLabel) {
  return template
    .replaceAll("{group}", groupingLabel || "")
    .replaceAll("{partCode}", row.partCode || "")
    .replaceAll("{fileName}", row.fileName || "")
    .replaceAll("{process}", row.suggestedProcess || "")
    .replaceAll("{serviceType}", row.serviceType || "");
}

module.exports = {
  WorkflowAutoPlanner,
  pickTemplateId,
  resolveWorkflowRoute,
};
