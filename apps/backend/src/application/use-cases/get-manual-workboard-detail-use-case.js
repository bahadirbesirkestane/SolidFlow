const { assertCanViewBoard } = require("../services/manual-workboard-access-policy");

class GetManualWorkboardDetailUseCase {
  constructor({ manualWorkboardRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
  }

  async execute(boardId, actor) {
    const board = await this.manualWorkboardRepository.getBoardById(boardId);
    assertCanViewBoard(board, actor);
    return board;
  }
}

module.exports = {
  GetManualWorkboardDetailUseCase,
};
