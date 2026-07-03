const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

class SqliteClient {
  constructor(rootPath) {
    const dataDir = path.join(rootPath, "data");
    fs.mkdirSync(dataDir, { recursive: true });
    this.databasePath = path.join(dataDir, "solid-workflow.db");
    this.database = new DatabaseSync(this.databasePath);
    this.database.exec("PRAGMA busy_timeout = 5000;");
    try {
      this.database.exec("PRAGMA journal_mode = WAL;");
    } catch (error) {
      // Fallback to default journal mode if another process is briefly holding a lock.
    }
    this.database.exec("PRAGMA foreign_keys = ON;");
  }

  getDb() {
    return this.database;
  }
}

module.exports = {
  SqliteClient,
};
