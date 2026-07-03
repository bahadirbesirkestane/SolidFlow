const fs = require("fs");
const path = require("path");

class JsonFileRepository {
  constructor(filePath, defaultValue) {
    this.filePath = filePath;
    this.defaultValue = defaultValue;
  }

  async ensureFile() {
    await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await fs.promises.access(this.filePath, fs.constants.F_OK);
    } catch (error) {
      await fs.promises.writeFile(this.filePath, JSON.stringify(this.defaultValue, null, 2), "utf8");
    }
  }

  async read() {
    await this.ensureFile();
    const content = await fs.promises.readFile(this.filePath, "utf8");
    return JSON.parse(content);
  }

  async write(data) {
    await this.ensureFile();
    await fs.promises.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf8");
    return data;
  }
}

module.exports = {
  JsonFileRepository,
};
