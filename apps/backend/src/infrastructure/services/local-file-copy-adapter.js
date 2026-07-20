const fs = require("fs");
const path = require("path");

class LocalFileCopyAdapter {
  async exists(targetPath) {
    try {
      await fs.promises.access(targetPath, fs.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  async copy(sourcePath, targetPath) {
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.copyFile(sourcePath, targetPath);
  }

  async rename(sourcePath, targetPath) {
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.rename(sourcePath, targetPath);
  }

  async canWrite(targetPath) {
    try {
      await fs.promises.access(targetPath, fs.constants.W_OK);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = {
  LocalFileCopyAdapter,
};
