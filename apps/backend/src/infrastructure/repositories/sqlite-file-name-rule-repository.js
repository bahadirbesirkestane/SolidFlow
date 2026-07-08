class SqliteFileNameRuleRepository {
  constructor(db) {
    this.db = db;
  }

  async getAll() {
    const rows = this.db.prepare(`
      SELECT
        id,
        name,
        pattern_mode,
        pattern_value,
        replacement_value,
        process,
        service_type,
        priority,
        apply_to,
        note,
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
        pattern_mode,
        pattern_value,
        replacement_value,
        process,
        service_type,
        priority,
        apply_to,
        note,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    runInTransaction(this.db, () => {
      deleteStatement.run();
      for (const rule of rules) {
        insertStatement.run(
          rule.id,
          rule.name,
          rule.patternMode,
          rule.patternValue,
          rule.replacementValue,
          rule.process || "",
          rule.serviceType || "",
          Number(rule.priority || 0),
          rule.applyTo,
          rule.note || "",
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
    patternMode: row.pattern_mode,
    patternValue: row.pattern_value,
    replacementValue: row.replacement_value || "",
    process: row.process || "",
    serviceType: row.service_type || "",
    priority: Number(row.priority || 0),
    applyTo: row.apply_to || "fileName",
    note: row.note || "",
    isActive: Boolean(row.is_active),
  };
}

module.exports = {
  SqliteFileNameRuleRepository,
};
