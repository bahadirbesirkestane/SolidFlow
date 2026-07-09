class SelectFolderUseCase {
  constructor({ folderPickerService }) {
    this.folderPickerService = folderPickerService;
  }

  async execute(input = {}) {
    const selectedPath = await this.folderPickerService.pickFolder({
      initialPath: String(input.initialPath || "").trim(),
      description: String(input.description || "").trim(),
    });

    return {
      selectedPath,
    };
  }
}

module.exports = {
  SelectFolderUseCase,
};
