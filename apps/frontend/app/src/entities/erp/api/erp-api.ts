import { apiRequest } from "@/shared/api/client";
import type { ProjectSummary, WorkflowInstance } from "@/entities/operations/api/operations-api";

export type ErpWorkOrderSummary = {
  id: string;
  erpNo: string;
  projectCode: string;
  customerName?: string;
  status: string;
  dueDate?: string;
  lineCount: number;
  totalQuantity: number;
  sourceType: string;
};

export type ErpDispatchStep = {
  title: string;
  description: string;
  status: "done" | "ready" | "attention" | string;
};

export type ErpDispatchDepartment = {
  departmentId?: string;
  departmentName?: string;
  lineCount: number;
  totalQuantity: number;
  assignees: Array<{
    id: string;
    fullName: string;
  }>;
};

export type ErpDispatch = {
  summary: {
    totalLines: number;
    readyLines: number;
    waitingLines: number;
  };
  nextSteps: ErpDispatchStep[];
  departments: ErpDispatchDepartment[];
};

export type ErpWorkOrderDetail = {
  workOrder: {
    id: string;
    erpNo: string;
    projectCode: string;
    customerName?: string;
    note?: string;
    dueDate?: string;
    sourceType?: string;
    linkedProjectId?: string;
    linkedProjectCode?: string;
  };
  dispatch: ErpDispatch;
  isStarted: boolean;
};

export type ErpStartResult = {
  project: ProjectSummary;
  workflows: WorkflowInstance[];
  workOrder: {
    id: string;
    erpNo: string;
    linkedProjectId?: string;
    linkedProjectCode?: string;
    status: string;
  };
};

export function listErpWorkOrders() {
  return apiRequest<ErpWorkOrderSummary[]>("/api/erp/work-orders");
}

export function getErpWorkOrderDetail(workOrderId: string) {
  return apiRequest<ErpWorkOrderDetail>(`/api/erp/work-orders/${encodeURIComponent(workOrderId)}`);
}

export function startErpWorkOrder(workOrderId: string) {
  return apiRequest<ErpStartResult>(`/api/erp/work-orders/${encodeURIComponent(workOrderId)}/start`, {
    method: "POST",
  });
}
