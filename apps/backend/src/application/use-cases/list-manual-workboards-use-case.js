const { filterAccessibleBoards } = require("../services/manual-workboard-access-policy");

class ListManualWorkboardsUseCase {
  constructor({ manualWorkboardRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
  }

  async execute(actor) {
    const boards = await this.manualWorkboardRepository.listBoards();
    return filterAccessibleBoards(boards, actor);
  }
}

module.exports = {
  ListManualWorkboardsUseCase,
};
