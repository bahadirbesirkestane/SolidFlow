class SqliteFileTypeRuleRepository {
  constructor(db) {
    this.db = db;
  }

  async getAll() {
    const rows = this.db.prepare(`
      SELECT extension, display_name, default_process, default_service_type, is_active
      FROM file_type_rules
      ORDER BY extension
    `).all();

    return rows.map(mapFileTypeRule);
  }

  async saveAll(rules) {
    const deleteStatement = this.db.prepare("DELETE FROM file_type_rules");
    const insertStatement = this.db.prepare(`
      INSERT INTO file_type_rules (extension, display_name, default_process, default_service_type, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);

    runInTransaction(this.db, () => {
      deleteStatement.run();
      for (const rule of rules) {
        insertStatement.run(
          rule.extension,
          rule.displayName,
          rule.defaultProcess,
          rule.defaultServiceType,
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

function mapFileTypeRule(row) {
  return {
    extension: row.extension,
    displayName: row.display_name,
    defaultProcess: row.default_process,
    defaultServiceType: row.default_service_type,
    isActive: Boolean(row.is_active),
  };
}

module.exports = {
  SqliteFileTypeRuleRepository,
};
