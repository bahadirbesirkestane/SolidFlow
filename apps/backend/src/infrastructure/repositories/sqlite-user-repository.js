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
      SELECT u.id, u.department_id, u.full_name, u.email, u.username, u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at, d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      ORDER BY u.full_name
    `).all().map(mapUser);
  }

  async getUserById(userId) {
    const row = this.db.prepare(`
      SELECT u.id, u.department_id, u.full_name, u.email, u.username, u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at, d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.id = ?
      LIMIT 1
    `).get(userId);

    return row ? mapUser(row) : null;
  }

  async findUserForAuth(login) {
    const normalizedLogin = String(login || "").trim().toLowerCase();
    const row = this.db.prepare(`
      SELECT
        u.id,
        u.department_id,
        u.full_name,
        u.email,
        u.username,
        u.role,
        u.password_hash,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE lower(u.username) = ? OR lower(u.email) = ?
      LIMIT 1
    `).get(normalizedLogin, normalizedLogin);

    return row
      ? {
        ...mapUser(row),
        passwordHash: row.password_hash || "",
      }
      : null;
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
    const normalizedUsername = String(input.username || "").trim().toLowerCase();
    const normalizedEmail = String(input.email || "").trim().toLowerCase();
    const duplicate = this.db.prepare(`
      SELECT id
      FROM users
      WHERE lower(username) = ?
        OR (? <> '' AND lower(email) = ?)
      LIMIT 1
    `).get(normalizedUsername, normalizedEmail, normalizedEmail);

    if (duplicate?.id) {
      throw new Error("Ayni kullanici adi veya e-posta zaten kayitli.");
    }

    const id = input.id || `user-${randomUUID()}`;
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO users (id, department_id, full_name, email, username, role, password_hash, is_active, last_login_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.departmentId,
      input.fullName,
      input.email || "",
      input.username,
      input.role,
      input.passwordHash,
      input.isActive ? 1 : 0,
      null,
      timestamp,
      timestamp,
    );

    return this.getUserById(id);
  }

  async deactivateUser(userId) {
    this.db.prepare(`
      UPDATE users
      SET is_active = 0, updated_at = ?
      WHERE id = ?
    `).run(nowIso(), userId);
  }

  async updateLastLoginAt(userId) {
    this.db.prepare(`
      UPDATE users
      SET last_login_at = ?, updated_at = ?
      WHERE id = ?
    `).run(nowIso(), nowIso(), userId);
  }
}

function mapUser(row) {
  return {
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    fullName: row.full_name,
    email: row.email,
    username: row.username || "",
    role: row.role || "worker",
    isActive: Boolean(row.is_active),
    lastLoginAt: row.last_login_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  SqliteUserRepository,
};
