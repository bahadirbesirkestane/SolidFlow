class SqlitePartOverrideRepository {
  constructor(db) {
    this.db = db;
  }

  async getAll() {
    const rows = this.db.prepare(`
      SELECT id, match_mode, part_code, file_name, process, service_type, note, is_active
      FROM part_overrides
      ORDER BY id
    `).all();

    return rows.map(mapPartOverride);
  }

  async saveAll(overrides) {
    const deleteStatement = this.db.prepare("DELETE FROM part_overrides");
    const insertStatement = this.db.prepare(`
      INSERT INTO part_overrides (id, match_mode, part_code, file_name, process, service_type, note, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    runInTransaction(this.db, () => {
      deleteStatement.run();
      for (const item of overrides) {
        insertStatement.run(
          item.id,
          item.matchMode,
          item.partCode || "",
          item.fileName || "",
          item.process,
          item.serviceType,
          item.note || "",
          item.isActive ? 1 : 0,
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

function mapPartOverride(row) {
  return {
    id: row.id,
    matchMode: row.match_mode,
    partCode: row.part_code,
    fileName: row.file_name,
    process: row.process,
    serviceType: row.service_type,
    note: row.note,
    isActive: Boolean(row.is_active),
  };
}

module.exports = {
  SqlitePartOverrideRepository,
};
