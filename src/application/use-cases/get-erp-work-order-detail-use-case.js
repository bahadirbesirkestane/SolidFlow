class GetErpWorkOrderDetailUseCase {
  constructor({ erpWorkOrderRepository, erpDispatchPlanner }) {
    this.erpWorkOrderRepository = erpWorkOrderRepository;
    this.erpDispatchPlanner = erpDispatchPlanner;
  }

  async execute(workOrderId) {
    const workOrder = await this.erpWorkOrderRepository.getById(workOrderId);
    if (!workOrder) {
      throw new Error("ERP iş emri bulunamadı.");
    }

    const dispatch = await this.erpDispatchPlanner.build(workOrder);

    return {
      workOrder,
      dispatch,
    };
  }
}

module.exports = {
  GetErpWorkOrderDetailUseCase,
};
