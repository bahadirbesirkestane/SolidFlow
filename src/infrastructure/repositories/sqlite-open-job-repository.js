const { randomUUID } = require("crypto");
const { nowIso } = require("../../shared/time-utils");

class SqliteOpenJobRepository {
  constructor(db) {
    this.db = db;
  }

  async create(input) {
    const id = randomUUID();
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO open_jobs (id, project_id, source_type, source_id, title, description, payload_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.projectId || "",
      input.sourceType,
      input.sourceId || "",
      input.title,
      input.description || "",
      JSON.stringify(input.payload || {}),
      input.status || "open",
      timestamp,
      timestamp,
    );

    return this.listAll();
  }

  async listAll() {
    return this.db.prepare(`
      SELECT id, project_id, source_type, source_id, title, description, payload_json, status, created_at, updated_at
      FROM open_jobs
      ORDER BY created_at DESC
    `).all().map((row) => ({
      id: row.id,
      projectId: row.project_id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      title: row.title,
      description: row.description,
      payload: safeJsonParse(row.payload_json),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch (error) {
    return {};
  }
}

module.exports = {
  SqliteOpenJobRepository,
};
