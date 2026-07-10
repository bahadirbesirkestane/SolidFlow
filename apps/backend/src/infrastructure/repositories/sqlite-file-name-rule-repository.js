class SqliteFileNameRuleRepository {
  constructor(db) {
    this.db = db;
  }

  async getAll() {
    const rows = this.db.prepare(`
      SELECT
        id,
        name,
        strategy_type,
        pattern_mode,
        pattern_value,
        replacement_value,
        process,
        service_type,
        priority,
        apply_to,
        note,
        workflow_template_id,
        flow_group_mode,
        flow_group_value,
        item_label_template,
        is_active
      FROM file_name_rules
      ORDER BY priority DESC, id
    `).all();

    return rows.map(mapFileNameRule);
  }

  async saveAll(rules) {
    const deleteStatement = this.db.prepare("DELETE FROM file_name_rules");
    const insertStatement = this.db.prepare(`
      INSERT INTO file_name_rules (
        id,
        name,
        strategy_type,
        pattern_mode,
        pattern_value,
        replacement_value,
        process,
        service_type,
        priority,
        apply_to,
        note,
        workflow_template_id,
        flow_group_mode,
        flow_group_value,
        item_label_template,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    runInTransaction(this.db, () => {
      deleteStatement.run();
      for (const rule of rules) {
        insertStatement.run(
          rule.id,
          rule.name,
          rule.strategyType || "normalize",
          rule.patternMode,
          rule.patternValue,
          rule.replacementValue,
          rule.process || "",
          rule.serviceType || "",
          Number(rule.priority || 0),
          rule.applyTo,
          rule.note || "",
          rule.workflowTemplateId || "",
          rule.flowGroupMode || "auto",
          rule.flowGroupValue || "",
          rule.itemLabelTemplate || "",
          rule.isActive ? 1 : 0,
        );
      }
    });

    return this.getAll();
  }
}

function runInTransaction(db, callback) {
  db.exec("BEGIN");
  try {
    callback();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function mapFileNameRule(row) {
  return {
    id: row.id,
    name: row.name,
    strategyType: row.strategy_type || "normalize",
    patternMode: row.pattern_mode,
    patternValue: row.pattern_value,
    replacementValue: row.replacement_value || "",
    process: row.process || "",
    serviceType: row.service_type || "",
    priority: Number(row.priority || 0),
    applyTo: row.apply_to || "fileName",
    note: row.note || "",
    workflowTemplateId: row.workflow_template_id || "",
    flowGroupMode: row.flow_group_mode || "auto",
    flowGroupValue: row.flow_group_value || "",
    itemLabelTemplate: row.item_label_template || "",
    isActive: Boolean(row.is_active),
  };
}

module.exports = {
  SqliteFileNameRuleRepository,
};
