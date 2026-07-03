class SqliteKeywordRuleRepository {
  constructor(db) {
    this.db = db;
  }

  async getAll() {
    const rows = this.db.prepare(`
      SELECT id, keyword, process, service_type, match_target, is_active
      FROM keyword_rules
      ORDER BY id
    `).all();

    return rows.map(mapKeywordRule);
  }

  async saveAll(rules) {
    const deleteStatement = this.db.prepare("DELETE FROM keyword_rules");
    const insertStatement = this.db.prepare(`
      INSERT INTO keyword_rules (id, keyword, process, service_type, match_target, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    runInTransaction(this.db, () => {
      deleteStatement.run();
      for (const rule of rules) {
        insertStatement.run(
          rule.id,
          rule.keyword,
          rule.process,
          rule.serviceType,
          rule.matchTarget,
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

function mapKeywordRule(row) {
  return {
    id: row.id,
    keyword: row.keyword,
    process: row.process,
    serviceType: row.service_type,
    matchTarget: row.match_target,
    isActive: Boolean(row.is_active),
  };
}

module.exports = {
  SqliteKeywordRuleRepository,
};
