const { randomUUID } = require("crypto");
const { nowIso } = require("../../shared/time-utils");

class SqliteUserRepository {
  constructor(db) {
    this.db = db;
  }

  async listDepartments() {
    return this.db.prepare(`
      SELECT id, name, is_active
      FROM departments
      ORDER BY name
    `).all().map((row) => ({
      id: row.id,
      name: row.name,
      isActive: Boolean(row.is_active),
    }));
  }

  async listUsers() {
    return this.db.prepare(`
      SELECT u.id, u.department_id, u.full_name, u.email, u.is_active, u.created_at, u.updated_at, d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      ORDER BY u.full_name
    `).all().map(mapUser);
  }

  async createDepartment(input) {
    const id = input.id || `dept-${randomUUID()}`;
    this.db.prepare(`
      INSERT INTO departments (id, name, is_active)
      VALUES (?, ?, ?)
    `).run(id, input.name, input.isActive ? 1 : 0);

    return (await this.listDepartments()).find((item) => item.id === id);
  }

  async createUser(input) {
    const id = input.id || `user-${randomUUID()}`;
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO users (id, department_id, full_name, email, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.departmentId,
      input.fullName,
      input.email || "",
      input.isActive ? 1 : 0,
      timestamp,
      timestamp,
    );

    return (await this.listUsers()).find((item) => item.id === id);
  }

  async deactivateUser(userId) {
    this.db.prepare(`
      UPDATE users
      SET is_active = 0, updated_at = ?
      WHERE id = ?
    `).run(nowIso(), userId);
  }
}

function mapUser(row) {
  return {
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    fullName: row.full_name,
    email: row.email,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  SqliteUserRepository,
};
