const fs = require("fs");
const path = require("path");

function migrateAndSeedDatabase({ db, rootPath }) {
  createTables(db);
  seedTableIfEmpty({
    db,
    tableName: "file_type_rules",
    readSeed: () => readSeedFile(rootPath, "file-type-rules.json"),
    insertMany: (rows) => insertFileTypeRules(db, rows),
  });
  seedTableIfEmpty({
    db,
    tableName: "keyword_rules",
    readSeed: () => readSeedFile(rootPath, "keyword-rules.json"),
    insertMany: (rows) => insertKeywordRules(db, rows),
  });
  seedTableIfEmpty({
    db,
    tableName: "file_name_rules",
    readSeed: () => readSeedFile(rootPath, "file-name-rules.json"),
    insertMany: (rows) => insertFileNameRules(db, rows),
  });
  ensureFileNameRules(db, rootPath);
  seedTableIfEmpty({
    db,
    tableName: "part_overrides",
    readSeed: () => readSeedFile(rootPath, "part-overrides.json"),
    insertMany: (rows) => insertPartOverrides(db, rows),
  });
  seedTableIfEmpty({
    db,
    tableName: "workflow_templates",
    readSeed: () => readSeedFile(rootPath, "workflow-templates.json"),
    insertMany: (rows) => insertWorkflowTemplates(db, rows),
  });
  ensureWorkflowTemplates(db, rootPath);
  seedDepartmentsAndUsersIfEmpty(db, rootPath);
}

function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_type_rules (
      extension TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      default_process TEXT NOT NULL,
      default_service_type TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS keyword_rules (
      id TEXT PRIMARY KEY,
      keyword TEXT NOT NULL,
      process TEXT NOT NULL,
      service_type TEXT NOT NULL,
      match_target TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS file_name_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pattern_mode TEXT NOT NULL,
      pattern_value TEXT NOT NULL,
      replacement_value TEXT,
      process TEXT,
      service_type TEXT,
      priority INTEGER NOT NULL DEFAULT 0,
      apply_to TEXT NOT NULL DEFAULT 'fileName',
      note TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS part_overrides (
      id TEXT PRIMARY KEY,
      match_mode TEXT NOT NULL,
      part_code TEXT,
      file_name TEXT,
      process TEXT NOT NULL,
      service_type TEXT NOT NULL,
      note TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS workflow_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS workflow_template_steps (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      sequence_no INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      default_assignee TEXT,
      is_optional INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (template_id) REFERENCES workflow_templates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_instances (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      item_label TEXT,
      item_count INTEGER NOT NULL DEFAULT 1,
      item_payload_json TEXT,
      status TEXT NOT NULL,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES workflow_templates(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_instance_steps (
      id TEXT PRIMARY KEY,
      instance_id TEXT NOT NULL,
      template_step_id TEXT NOT NULL,
      sequence_no INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      assignee TEXT,
      handover_to TEXT,
      approved_by TEXT,
      completion_note TEXT,
      status TEXT NOT NULL,
      is_optional INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
      FOREIGN KEY (template_step_id) REFERENCES workflow_template_steps(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_step_assignees (
      id TEXT PRIMARY KEY,
      step_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      assigned_at TEXT NOT NULL,
      UNIQUE(step_id, user_id),
      FOREIGN KEY (step_id) REFERENCES workflow_instance_steps(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS open_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      source_type TEXT NOT NULL,
      source_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      payload_json TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload_json TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function seedTableIfEmpty({ db, tableName, readSeed, insertMany }) {
  const row = db.prepare(`SELECT COUNT(1) AS count FROM ${tableName}`).get();
  if (row.count > 0) {
    return;
  }

  const seedRows = readSeed();
  if (Array.isArray(seedRows) && seedRows.length > 0) {
    insertMany(seedRows);
  }
}

function readSeedFile(rootPath, fileName) {
  const filePath = path.join(rootPath, "data", fileName);
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function insertFileTypeRules(db, rows) {
  const statement = db.prepare(`
    INSERT INTO file_type_rules (extension, display_name, default_process, default_service_type, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);
  runInTransaction(db, () => {
    for (const row of rows) {
      statement.run(
        row.extension,
        row.displayName,
        row.defaultProcess,
        row.defaultServiceType,
        row.isActive ? 1 : 0,
      );
    }
  });
}

function insertKeywordRules(db, rows) {
  const statement = db.prepare(`
    INSERT INTO keyword_rules (id, keyword, process, service_type, match_target, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  runInTransaction(db, () => {
    for (const row of rows) {
      statement.run(
        row.id,
        row.keyword,
        row.process,
        row.serviceType,
        row.matchTarget,
        row.isActive ? 1 : 0,
      );
    }
  });
}

function insertPartOverrides(db, rows) {
  const statement = db.prepare(`
    INSERT INTO part_overrides (id, match_mode, part_code, file_name, process, service_type, note, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  runInTransaction(db, () => {
    for (const row of rows) {
      statement.run(
        row.id,
        row.matchMode,
        row.partCode || "",
        row.fileName || "",
        row.process,
        row.serviceType,
        row.note || "",
        row.isActive ? 1 : 0,
      );
    }
  });
}

function insertFileNameRules(db, rows) {
  const statement = db.prepare(`
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
  runInTransaction(db, () => {
    for (const row of rows) {
      statement.run(
        row.id,
        row.name,
        row.patternMode,
        row.patternValue,
        row.replacementValue || "",
        row.process || "",
        row.serviceType || "",
        Number(row.priority || 0),
        row.applyTo || "fileName",
        row.note || "",
        row.isActive ? 1 : 0,
      );
    }
  });
}

function ensureFileNameRules(db, rootPath) {
  const seedRows = readSeedFile(rootPath, "file-name-rules.json");
  if (!Array.isArray(seedRows) || seedRows.length === 0) {
    return;
  }

  const existingIds = new Set(
    db.prepare("SELECT id FROM file_name_rules").all().map((row) => row.id),
  );
  const missingRows = seedRows.filter((row) => !existingIds.has(row.id));
  if (missingRows.length === 0) {
    return;
  }

  insertFileNameRules(db, missingRows);
}

function insertWorkflowTemplates(db, rows) {
  const templateStatement = db.prepare(`
    INSERT INTO workflow_templates (id, name, description, is_active)
    VALUES (?, ?, ?, ?)
  `);
  const stepStatement = db.prepare(`
    INSERT INTO workflow_template_steps (id, template_id, sequence_no, name, description, default_assignee, is_optional)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  runInTransaction(db, () => {
    for (const row of rows) {
      templateStatement.run(
        row.id,
        row.name,
        row.description || "",
        row.isActive ? 1 : 0,
      );

      for (const step of row.steps || []) {
        stepStatement.run(
          step.id,
          row.id,
          step.sequenceNo,
          step.name,
          step.description || "",
          step.defaultAssignee || "",
          step.isOptional ? 1 : 0,
        );
      }
    }
  });
}

function ensureWorkflowTemplates(db, rootPath) {
  const seedRows = readSeedFile(rootPath, "workflow-templates.json");
  if (!Array.isArray(seedRows) || seedRows.length === 0) {
    return;
  }

  const existingIds = new Set(
    db.prepare("SELECT id FROM workflow_templates").all().map((row) => row.id),
  );
  const missingRows = seedRows.filter((row) => !existingIds.has(row.id));
  if (missingRows.length === 0) {
    return;
  }

  insertWorkflowTemplates(db, missingRows);
}

function seedDepartmentsAndUsersIfEmpty(db, rootPath) {
  const departmentCount = db.prepare("SELECT COUNT(1) AS count FROM departments").get().count;
  const userCount = db.prepare("SELECT COUNT(1) AS count FROM users").get().count;
  if (departmentCount > 0 || userCount > 0) {
    return;
  }

  const payload = readSeedFile(rootPath, "departments-users.json");
  const departments = payload.departments || [];
  const users = payload.users || [];

  const departmentStatement = db.prepare(`
    INSERT INTO departments (id, name, is_active)
    VALUES (?, ?, ?)
  `);
  const userStatement = db.prepare(`
    INSERT INTO users (id, department_id, full_name, email, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const timestamp = new Date().toISOString();
  runInTransaction(db, () => {
    for (const department of departments) {
      departmentStatement.run(department.id, department.name, department.isActive ? 1 : 0);
    }
    for (const user of users) {
      userStatement.run(
        user.id,
        user.departmentId,
        user.fullName,
        user.email || "",
        user.isActive ? 1 : 0,
        timestamp,
        timestamp,
      );
    }
  });
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

module.exports = {
  migrateAndSeedDatabase,
};
