const { randomUUID } = require("crypto");
const { nowIso } = require("../../shared/time-utils");

class SqliteAuditLogRepository {
  constructor(db) {
    this.db = db;
  }

  async log(event) {
    this.db.prepare(`
      INSERT INTO audit_events (id, project_id, actor_user_id, entity_type, entity_id, action, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      event.projectId || "",
      event.actorUserId || "",
      event.entityType,
      event.entityId,
      event.action,
      JSON.stringify(event.payload || {}),
      nowIso(),
    );
  }

  async listByProjectId(projectId) {
    return this.db.prepare(`
      SELECT id, project_id, actor_user_id, entity_type, entity_id, action, payload_json, created_at
      FROM audit_events
      WHERE project_id = ?
      ORDER BY created_at DESC
    `).all(projectId).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      actorUserId: row.actor_user_id || "",
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      payload: safeJsonParse(row.payload_json),
      createdAt: row.created_at,
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
  SqliteAuditLogRepository,
};
