const { randomUUID } = require("crypto");
const { nowIso } = require("../../shared/time-utils");

class SqliteProjectRepository {
  constructor(db) {
    this.db = db;
  }

  async create(project) {
    const id = randomUUID();
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO projects (id, code, name, description, folder_path, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      project.code,
      project.name,
      project.description || "",
      project.folderPath || "",
      "active",
      timestamp,
      timestamp,
    );

    return this.getById(id);
  }

  async getById(projectId) {
    const row = this.db.prepare(`
      SELECT id, code, name, description, folder_path, status, created_at, updated_at
      FROM projects
      WHERE id = ?
    `).get(projectId);

    return row ? mapProject(row) : null;
  }

  async listAll() {
    const rows = this.db.prepare(`
      SELECT id, code, name, description, folder_path, status, created_at, updated_at
      FROM projects
      ORDER BY created_at DESC
    `).all();

    return rows.map(mapProject);
  }

  async touch(projectId) {
    this.db.prepare(`
      UPDATE projects
      SET updated_at = ?
      WHERE id = ?
    `).run(nowIso(), projectId);
  }

  async delete(projectId) {
    const project = await this.getById(projectId);
    if (!project) {
      return null;
    }

    this.db.exec("BEGIN");
    try {
      this.db.prepare(`DELETE FROM open_jobs WHERE project_id = ?`).run(projectId);
      this.db.prepare(`DELETE FROM audit_events WHERE project_id = ?`).run(projectId);
      this.db.prepare(`DELETE FROM projects WHERE id = ?`).run(projectId);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return project;
  }
}

function mapProject(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    folderPath: row.folder_path || "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  SqliteProjectRepository,
};
