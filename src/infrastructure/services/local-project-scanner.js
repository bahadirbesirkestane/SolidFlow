const fs = require("fs");
const path = require("path");

class LocalProjectScanner {
  async scan(rootPath, fileTypeRules) {
    const supportedExtensions = new Set(fileTypeRules.map((rule) => rule.extension));
    const rootFolderName = path.basename(rootPath);
    const files = [];

    async function walk(currentPath) {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const absolutePath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await walk(absolutePath);
          continue;
        }

        const extension = path.extname(entry.name).toUpperCase();
        if (!supportedExtensions.has(extension)) {
          continue;
        }

        const relativePath = path.relative(rootPath, absolutePath);
        files.push({
          absolutePath,
          relativePath,
          fileName: entry.name,
          extension,
          folder: path.dirname(relativePath) === "." ? rootFolderName : path.dirname(relativePath),
        });
      }
    }

    await walk(rootPath);
    return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath, "tr"));
  }
}

module.exports = {
  LocalProjectScanner,
};
