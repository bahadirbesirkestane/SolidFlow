import { apiRequest } from "@/shared/api/client";

export type ManualWorkboardStatus =
  | "Beklemede"
  | "Hazirlaniyor"
  | "Devam Ediyor"
  | "Kontrol Ediliyor"
  | "Tamamlandi";

export type ManualWorkboardAssignee = {
  userId: string;
  fullName: string;
};

export type ManualWorkboardItem = {
  id: string;
  boardId: string;
  parentId: string | null;
  title: string;
  content: string;
  status: ManualWorkboardStatus;
  progressPercent: number;
  orderIndex: number;
  depth: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  assigneeIds: string[];
  assignees: ManualWorkboardAssignee[];
};

export type ManualWorkboardSummary = {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  departmentName: string;
  isActive: boolean;
  isVisibleOnDisplay: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
};

export type ManualWorkboardDetail = ManualWorkboardSummary & {
  items: ManualWorkboardItem[];
};

export const manualWorkboardStatuses: ManualWorkboardStatus[] = [
  "Beklemede",
  "Hazirlaniyor",
  "Devam Ediyor",
  "Kontrol Ediliyor",
  "Tamamlandi",
];

export function listManualWorkboards() {
  return apiRequest<ManualWorkboardSummary[]>("/api/manual-workboards");
}

export function getManualWorkboardDetail(boardId: string) {
  return apiRequest<ManualWorkboardDetail>(`/api/manual-workboards/${encodeURIComponent(boardId)}`);
}

export function createManualWorkboard(payload: {
  name: string;
  description: string;
  departmentId: string;
  isActive: boolean;
  isVisibleOnDisplay: boolean;
}) {
  return apiRequest<ManualWorkboardDetail>("/api/manual-workboards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateManualWorkboard(
  boardId: string,
  payload: {
    name?: string;
    description?: string;
    departmentId?: string;
    isActive?: boolean;
    isVisibleOnDisplay?: boolean;
  },
) {
  return apiRequest<ManualWorkboardDetail>(`/api/manual-workboards/${encodeURIComponent(boardId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteManualWorkboard(boardId: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/manual-workboards/${encodeURIComponent(boardId)}`, {
    method: "DELETE",
  });
}

export function createManualWorkboardItem(
  boardId: string,
  payload: {
    title: string;
    content: string;
    status: ManualWorkboardStatus;
    parentId?: string | null;
    assigneeIds: string[];
  },
) {
  return apiRequest<ManualWorkboardItem>(`/api/manual-workboards/${encodeURIComponent(boardId)}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateManualWorkboardItem(
  itemId: string,
  payload: {
    title?: string;
    content?: string;
    status?: ManualWorkboardStatus;
    assigneeIds?: string[];
    isArchived?: boolean;
  },
) {
  return apiRequest<ManualWorkboardItem>(`/api/manual-workboards/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function moveManualWorkboardItem(
  itemId: string,
  payload: {
    parentId?: string | null;
    targetOrderIndex?: number;
  },
) {
  return apiRequest<ManualWorkboardItem>(`/api/manual-workboards/items/${encodeURIComponent(itemId)}/move`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reorderManualWorkboardItem(itemId: string, direction: "up" | "down") {
  return apiRequest<ManualWorkboardItem>(`/api/manual-workboards/items/${encodeURIComponent(itemId)}/reorder`, {
    method: "POST",
    body: JSON.stringify({ direction }),
  });
}

export function deleteManualWorkboardItem(itemId: string) {
  return apiRequest<{ id: string; deleted: boolean; deletedItemCount: number }>(
    `/api/manual-workboards/items/${encodeURIComponent(itemId)}`,
    {
      method: "DELETE",
    },
  );
}
