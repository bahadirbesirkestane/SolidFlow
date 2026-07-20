import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listUsers, type UserRecord } from "@/entities/operations/api/operations-api";
import {
  createManualWorkboard,
  createManualWorkboardItem,
  deleteManualWorkboard,
  deleteManualWorkboardItem,
  getManualWorkboardDetail,
  listManualWorkboards,
  manualWorkboardStatuses,
  moveManualWorkboardItem,
  reorderManualWorkboardItem,
  updateManualWorkboard,
  updateManualWorkboardItem,
  type ManualWorkboardDetail,
  type ManualWorkboardItem,
  type ManualWorkboardStatus,
} from "@/entities/manual-workboards/api/manual-workboards-api";
import { emitManualWorkboardLiveEvent, subscribeManualWorkboardLiveEvents } from "@/entities/manual-workboards/lib/live-updates";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { SplitLayout } from "@/shared/ui/SplitLayout";
import { StatusBanner } from "@/shared/ui/StatusBanner";

type BoardFormState = {
  name: string;
  description: string;
  departmentId: string;
  isActive: boolean;
  isVisibleOnDisplay: boolean;
};

type ItemFormState = {
  title: string;
  content: string;
  status: ManualWorkboardStatus;
  assigneeIds: string[];
  parentId: string;
  assigneeScope: "department" | "all";
};

const emptyBoardForm: BoardFormState = {
  name: "",
  description: "",
  departmentId: "",
  isActive: true,
  isVisibleOnDisplay: true,
};

const emptyItemForm: ItemFormState = {
  title: "",
  content: "",
  status: "Beklemede",
  assigneeIds: [],
  parentId: "",
  assigneeScope: "department",
};

export function ManualWorkboardsPage() {
  const queryClient = useQueryClient();
  const boardsQuery = useQuery({
    queryKey: ["manualWorkboards", "list"],
    queryFn: listManualWorkboards,
  });
  const usersQuery = useQuery({
    queryKey: ["operations", "users"],
    queryFn: listUsers,
  });

  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [boardForm, setBoardForm] = useState<BoardFormState>(emptyBoardForm);
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm);
  const [draggedItemId, setDraggedItemId] = useState("");
  const [dragTargetKey, setDragTargetKey] = useState("");

  const boards = boardsQuery.data || [];
  const boardDetailQuery = useQuery({
    queryKey: ["manualWorkboards", "detail", selectedBoardId],
    queryFn: () => getManualWorkboardDetail(selectedBoardId),
    enabled: Boolean(selectedBoardId),
  });

  const selectedBoard = boardDetailQuery.data || null;
  const selectedItem = useMemo(
    () => selectedBoard?.items.find((item) => item.id === selectedItemId) || null,
    [selectedBoard?.items, selectedItemId],
  );

  const departments = usersQuery.data?.departments || [];
  const users = usersQuery.data?.users || [];
  const usersById = useMemo(
    () =>
      users.reduce<Record<string, UserRecord>>((accumulator, user) => {
        accumulator[user.id] = user;
        return accumulator;
      }, {}),
    [users],
  );

  useEffect(() => {
    const unsubscribe = subscribeManualWorkboardLiveEvents((event) => {
      if (!selectedBoardId || event.boardId !== selectedBoardId) {
        return;
      }

      void refreshSelectedBoard(queryClient, selectedBoardId);
    });

    return unsubscribe;
  }, [queryClient, selectedBoardId]);

  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  useEffect(() => {
    if (isCreatingBoard) {
      if (!boardForm.departmentId && departments.length > 0) {
        setBoardForm((current) => ({ ...current, departmentId: departments[0].id }));
      }
      return;
    }

    if (!selectedBoard) {
      return;
    }

    setBoardForm({
      name: selectedBoard.name,
      description: selectedBoard.description || "",
      departmentId: selectedBoard.departmentId,
      isActive: selectedBoard.isActive,
      isVisibleOnDisplay: selectedBoard.isVisibleOnDisplay,
    });
  }, [departments, isCreatingBoard, selectedBoard]);

  useEffect(() => {
    if (!selectedBoard) {
      setSelectedItemId("");
      return;
    }

    if (selectedBoard.items.length === 0) {
      setSelectedItemId("");
      return;
    }

    const stillExists = selectedBoard.items.some((item) => item.id === selectedItemId);
    if (!stillExists) {
      setSelectedItemId(selectedBoard.items[0].id);
    }
  }, [selectedBoard, selectedItemId]);

  useEffect(() => {
    if (!selectedItem) {
      setItemForm(emptyItemForm);
      return;
    }

    setItemForm({
      title: selectedItem.title,
      content: selectedItem.content || "",
      status: selectedItem.status,
      assigneeIds: selectedItem.assigneeIds,
      parentId: selectedItem.parentId || "",
      assigneeScope: "department",
    });
  }, [selectedItem]);

  const createBoardMutation = useMutation({
    mutationFn: createManualWorkboard,
    onSuccess: async (board) => {
      setIsCreatingBoard(false);
      setSelectedBoardId(board.id);
      emitManualWorkboardLiveEvent(board.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["manualWorkboards", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["manualWorkboards", "detail", board.id] }),
      ]);
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: ({ boardId, payload }: { boardId: string; payload: BoardFormState }) =>
      updateManualWorkboard(boardId, payload),
    onSuccess: async (board) => {
      emitManualWorkboardLiveEvent(board.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["manualWorkboards", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["manualWorkboards", "detail", board.id] }),
      ]);
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: deleteManualWorkboard,
    onSuccess: async (_, boardId) => {
      const remainingBoards = boards.filter((board) => board.id !== boardId);
      setSelectedBoardId(remainingBoards[0]?.id || "");
      setSelectedItemId("");
      setIsCreatingBoard(false);
      emitManualWorkboardLiveEvent(boardId);
      await queryClient.invalidateQueries({ queryKey: ["manualWorkboards", "list"] });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: ({
      boardId,
      payload,
    }: {
      boardId: string;
      payload: {
        title: string;
        content: string;
        status: ManualWorkboardStatus;
        parentId?: string | null;
        assigneeIds: string[];
      };
    }) => createManualWorkboardItem(boardId, payload),
    onSuccess: async (item) => {
      setSelectedItemId(item.id);
      emitManualWorkboardLiveEvent(item.boardId);
      await refreshSelectedBoard(queryClient, item.boardId);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: {
        title?: string;
        content?: string;
        status?: ManualWorkboardStatus;
        assigneeIds?: string[];
        isArchived?: boolean;
      };
    }) => updateManualWorkboardItem(itemId, payload),
    onSuccess: async (item) => {
      emitManualWorkboardLiveEvent(item.boardId);
      await refreshSelectedBoard(queryClient, item.boardId);
    },
  });

  const moveItemMutation = useMutation({
    mutationFn: ({
      itemId,
      parentId,
      targetOrderIndex,
    }: {
      itemId: string;
      parentId?: string | null;
      targetOrderIndex?: number;
    }) => moveManualWorkboardItem(itemId, { parentId, targetOrderIndex }),
    onSuccess: async (item) => {
      emitManualWorkboardLiveEvent(item.boardId);
      setDragTargetKey("");
      setDraggedItemId("");
      await refreshSelectedBoard(queryClient, item.boardId);
    },
  });

  const reorderItemMutation = useMutation({
    mutationFn: ({ itemId, direction }: { itemId: string; direction: "up" | "down" }) =>
      reorderManualWorkboardItem(itemId, direction),
    onSuccess: async (item) => {
      emitManualWorkboardLiveEvent(item.boardId);
      await refreshSelectedBoard(queryClient, item.boardId);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteManualWorkboardItem,
    onSuccess: async () => {
      setSelectedItemId("");
      if (selectedBoardId) {
        emitManualWorkboardLiveEvent(selectedBoardId);
        await refreshSelectedBoard(queryClient, selectedBoardId);
      }
    },
  });

  const boardMetrics = useMemo(() => {
    const items = selectedBoard?.items || [];
    return {
      total: items.length,
      completed: items.filter((item) => item.status === "Tamamlandi").length,
      active: items.filter((item) => item.status !== "Tamamlandi").length,
      visible: selectedBoard?.isVisibleOnDisplay ? "Acik" : "Kapali",
    };
  }, [selectedBoard]);

  const operationErrors = [
    boardsQuery.error,
    boardDetailQuery.error,
    usersQuery.error,
    createBoardMutation.error,
    updateBoardMutation.error,
    deleteBoardMutation.error,
    createItemMutation.error,
    updateItemMutation.error,
    moveItemMutation.error,
    reorderItemMutation.error,
    deleteItemMutation.error,
  ].filter((error): error is Error => Boolean(error));

  const canMoveUp = useMemo(() => {
    if (!selectedBoard || !selectedItem) {
      return false;
    }

    const siblings = getSiblingItems(selectedBoard.items, selectedItem);
    return siblings.findIndex((item) => item.id === selectedItem.id) > 0;
  }, [selectedBoard, selectedItem]);

  const canMoveDown = useMemo(() => {
    if (!selectedBoard || !selectedItem) {
      return false;
    }

    const siblings = getSiblingItems(selectedBoard.items, selectedItem);
    const currentIndex = siblings.findIndex((item) => item.id === selectedItem.id);
    return currentIndex > -1 && currentIndex < siblings.length - 1;
  }, [selectedBoard, selectedItem]);

  async function handleBoardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatingBoard) {
      const createdBoard = await createBoardMutation.mutateAsync(boardForm);
      setBoardForm({
        name: createdBoard.name,
        description: createdBoard.description || "",
        departmentId: createdBoard.departmentId,
        isActive: createdBoard.isActive,
        isVisibleOnDisplay: createdBoard.isVisibleOnDisplay,
      });
      return;
    }

    if (!selectedBoard) {
      return;
    }

    await updateBoardMutation.mutateAsync({
      boardId: selectedBoard.id,
      payload: boardForm,
    });
  }

  async function handleItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBoard || !selectedItem) {
      return;
    }

    const normalizedParentId = itemForm.parentId || null;
    const currentParentId = selectedItem.parentId || null;
    if (normalizedParentId !== currentParentId) {
      const siblingItems = selectedBoard.items.filter(
        (item) => (item.parentId || null) === normalizedParentId && item.id !== selectedItem.id,
      );
      await moveItemMutation.mutateAsync({
        itemId: selectedItem.id,
        parentId: normalizedParentId,
        targetOrderIndex: siblingItems.length,
      });
    }

    await updateItemMutation.mutateAsync({
      itemId: selectedItem.id,
      payload: {
        title: itemForm.title.trim(),
        content: itemForm.content.trim(),
        status: itemForm.status,
        assigneeIds: itemForm.assigneeIds,
      },
    });
  }

  async function handleCreateRootItem() {
    if (!selectedBoard) {
      return;
    }

    await createItemMutation.mutateAsync({
      boardId: selectedBoard.id,
      payload: {
        title: "Yeni is",
        content: "",
        status: "Beklemede",
        assigneeIds: [],
        parentId: null,
      },
    });
  }

  async function handleCreateChildItem() {
    if (!selectedBoard || !selectedItem) {
      return;
    }

    await createItemMutation.mutateAsync({
      boardId: selectedBoard.id,
      payload: {
        title: "Yeni alt is",
        content: "",
        status: "Beklemede",
        assigneeIds: [],
        parentId: selectedItem.id,
      },
    });
  }

  async function handleDeleteBoard() {
    if (!selectedBoard) {
      return;
    }

    if (!window.confirm(`${selectedBoard.name} panosu silinsin mi?`)) {
      return;
    }

    await deleteBoardMutation.mutateAsync(selectedBoard.id);
  }

  async function handleDeleteItem() {
    if (!selectedItem) {
      return;
    }

    const message = "Secili is ve varsa alt isleri silinecek. Devam edilsin mi?";
    if (!window.confirm(message)) {
      return;
    }

    await deleteItemMutation.mutateAsync(selectedItem.id);
  }

  async function handleDropBefore(targetItem: ManualWorkboardItem) {
    if (!selectedBoard || !draggedItemId || draggedItemId === targetItem.id) {
      return;
    }

    const targetSiblings = selectedBoard.items
      .filter((item) => (item.parentId || null) === (targetItem.parentId || null))
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const targetIndex = targetSiblings.findIndex((item) => item.id === targetItem.id);
    await moveItemMutation.mutateAsync({
      itemId: draggedItemId,
      parentId: targetItem.parentId || null,
      targetOrderIndex: Math.max(targetIndex, 0),
    });
  }

  async function handleDropAsChild(targetItem: ManualWorkboardItem) {
    if (!selectedBoard || !draggedItemId || draggedItemId === targetItem.id) {
      return;
    }

    const childCount = selectedBoard.items.filter((item) => (item.parentId || null) === targetItem.id).length;
    await moveItemMutation.mutateAsync({
      itemId: draggedItemId,
      parentId: targetItem.id,
      targetOrderIndex: childCount,
    });
  }

  async function handleDropToRoot() {
    if (!selectedBoard || !draggedItemId) {
      return;
    }

    const rootCount = selectedBoard.items.filter((item) => !item.parentId).length;
    await moveItemMutation.mutateAsync({
      itemId: draggedItemId,
      parentId: null,
      targetOrderIndex: rootCount,
    });
  }

  function handleDragStart(event: DragEvent<HTMLElement>, itemId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDraggedItemId(itemId);
  }

  function handleDragEnd() {
    setDraggedItemId("");
    setDragTargetKey("");
  }

  return (
    <PageShell
      title="Manuel Is Panosu"
      description="Mevcut operasyon shell dili korunarak, parent-child yapili manuel islerin ayni sayfadan olusturulup yonetildigi sade calisma alani."
      actions={(
        <>
          <button type="button" onClick={() => void boardsQuery.refetch()}>
            Yenile
          </button>
          <button type="button" onClick={() => {
            setIsCreatingBoard(true);
            setBoardForm({
              ...emptyBoardForm,
              departmentId: departments[0]?.id || "",
            });
          }}
          >
            Yeni Pano
          </button>
          <button type="button" onClick={() => void handleCreateRootItem()} disabled={!selectedBoard || createItemMutation.isPending}>
            Yeni Ana Is
          </button>
          <button type="button" onClick={() => void handleCreateChildItem()} disabled={!selectedBoard || !selectedItem || createItemMutation.isPending}>
            Alt Is Ekle
          </button>
          {selectedBoard ? (
            <Link to={`/manual-workboards/display/${selectedBoard.id}`}>Gosterim Ekranini Ac</Link>
          ) : null}
        </>
      )}
    >
      <StatusBanner>
        Sol tarafta panolar ve agac kart listesi, sag tarafta secili isin duzenleme paneli bulunur. Gorunum dili mevcut operasyon ekranlariyla ayni ailede kalir.
      </StatusBanner>

      {operationErrors.length > 0 ? (
        <StatusBanner tone="danger">
          {operationErrors[0].message}
        </StatusBanner>
      ) : null}

      <SplitLayout
        rail={(
          <>
            <SectionCard
              title="Pano Havuzu"
              description={`${boards.length} pano`}
              actions={(
                <button type="button" onClick={() => void boardsQuery.refetch()}>
                  Listeyi Yenile
                </button>
              )}
            >
              <div className="stack-list">
                {boards.map((board) => (
                  <button
                    key={board.id}
                    type="button"
                    className={`project-tile${board.id === selectedBoardId ? " is-active" : ""}`}
                    onClick={() => {
                      setIsCreatingBoard(false);
                      setSelectedBoardId(board.id);
                    }}
                  >
                    <div className="project-tile__head">
                      <strong>{board.name}</strong>
                      <span>{board.itemCount}</span>
                    </div>
                    <p>{board.departmentName || "Departman yok"}</p>
                    <small>{board.isVisibleOnDisplay ? "Gosterimde acik" : "Gosterimde kapali"}</small>
                  </button>
                ))}
                {boardsQuery.isLoading ? <div className="empty-state">Panolar yukleniyor...</div> : null}
                {!boardsQuery.isLoading && boards.length === 0 ? (
                  <div className="empty-state">Henuz manuel pano yok. Ustten yeni pano olustur.</div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title={isCreatingBoard ? "Yeni Pano" : "Pano Ayarlari"}
              description="Ayni sayfadan pano olustur, guncelle veya kaldir"
            >
              <form className="form-grid" onSubmit={handleBoardSubmit}>
                <FormField label="Pano adi">
                  <input
                    value={boardForm.name}
                    onChange={(event) => setBoardForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ornek: Montaj vardiya panosu"
                    required
                  />
                </FormField>
                <FormField label="Departman">
                  <select
                    value={boardForm.departmentId}
                    onChange={(event) => setBoardForm((current) => ({ ...current, departmentId: event.target.value }))}
                    required
                  >
                    <option value="">Departman sec</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Aciklama">
                  <input
                    value={boardForm.description}
                    onChange={(event) => setBoardForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Pano kullanim notu"
                  />
                </FormField>
                <FormField label="Gosterim durumu">
                  <select
                    value={boardForm.isVisibleOnDisplay ? "1" : "0"}
                    onChange={(event) =>
                      setBoardForm((current) => ({ ...current, isVisibleOnDisplay: event.target.value === "1" }))
                    }
                  >
                    <option value="1">Gosterimde acik</option>
                    <option value="0">Gosterimde kapali</option>
                  </select>
                </FormField>
                <FormField label="Pano durumu">
                  <select
                    value={boardForm.isActive ? "1" : "0"}
                    onChange={(event) => setBoardForm((current) => ({ ...current, isActive: event.target.value === "1" }))}
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Pasif</option>
                  </select>
                </FormField>
                <div className="form-actions manual-board-form-actions">
                  <button type="submit" disabled={createBoardMutation.isPending || updateBoardMutation.isPending}>
                    {isCreatingBoard
                      ? (createBoardMutation.isPending ? "Olusturuluyor..." : "Panoyu Olustur")
                      : (updateBoardMutation.isPending ? "Kaydediliyor..." : "Panoyu Kaydet")}
                  </button>
                  {isCreatingBoard ? (
                    <button type="button" onClick={() => setIsCreatingBoard(false)}>
                      Iptal
                    </button>
                  ) : (
                    <button type="button" onClick={() => void handleDeleteBoard()} disabled={!selectedBoard || deleteBoardMutation.isPending}>
                      Panoyu Sil
                    </button>
                  )}
                </div>
              </form>
            </SectionCard>

            <SectionCard
              title="Pano Ozeti"
              description="Secili panonun hizli operasyon gorunumu"
            >
              <div className="metric-grid">
                <article className="metric-panel">
                  <span>Toplam Is</span>
                  <strong>{boardMetrics.total}</strong>
                </article>
                <article className="metric-panel">
                  <span>Aktif Is</span>
                  <strong>{boardMetrics.active}</strong>
                </article>
                <article className="metric-panel">
                  <span>Tamamlanan</span>
                  <strong>{boardMetrics.completed}</strong>
                </article>
                <article className="metric-panel">
                  <span>Gosterim</span>
                  <strong>{boardMetrics.visible}</strong>
                </article>
              </div>
              {selectedBoard ? (
                <div className="section-card__action-row">
                  <Link to={`/manual-workboards/display/${selectedBoard.id}`}>Read-only gosterim sayfasini ac</Link>
                </div>
              ) : null}
            </SectionCard>
          </>
        )}
      >
        <div className="manual-board-page">
          <SectionCard
            title={selectedBoard?.name || "Manuel Is Agaci"}
            description={selectedBoard?.description || "Pano secildiginde parent-child kart yapisi burada gorunur."}
          >
            {boardDetailQuery.isLoading ? (
              <div className="empty-state">Pano detaylari yukleniyor...</div>
            ) : selectedBoard ? (
              <div className="manual-board-shell">
                <section className="workspace-panel">
                  <div className="workspace-panel__header">
                    <div>
                      <h3>Agac Kart Listesi</h3>
                      <p>Satira tiklayarak sec, ust aksiyonlarla yeni is ekle veya sira degistir</p>
                    </div>
                    <div className="section-card__action-row">
                      <button type="button" onClick={() => void handleCreateRootItem()} disabled={createItemMutation.isPending}>
                        Yeni Ana Is
                      </button>
                      <button type="button" onClick={() => void handleCreateChildItem()} disabled={!selectedItem || createItemMutation.isPending}>
                        Alt Is
                      </button>
                      <button
                        type="button"
                        onClick={() => selectedItem && reorderItemMutation.mutate({ itemId: selectedItem.id, direction: "up" })}
                        disabled={!selectedItem || !canMoveUp || reorderItemMutation.isPending}
                      >
                        Yukari
                      </button>
                      <button
                        type="button"
                        onClick={() => selectedItem && reorderItemMutation.mutate({ itemId: selectedItem.id, direction: "down" })}
                        disabled={!selectedItem || !canMoveDown || reorderItemMutation.isPending}
                      >
                        Asagi
                      </button>
                    </div>
                  </div>

                  <div className="manual-board-tree">
                    {selectedBoard.items.map((item) => {
                      const assigneeNames = item.assignees.map((assignee) => assignee.fullName).join(", ");
                      return (
                        <div key={item.id} className="manual-board-tree__item" style={{ marginLeft: `${item.depth * 28}px` }}>
                          <div
                            className={`manual-board-dropzone${dragTargetKey === `before:${item.id}` ? " is-active" : ""}`}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragTargetKey(`before:${item.id}`);
                            }}
                            onDragLeave={() => setDragTargetKey((current) => (current === `before:${item.id}` ? "" : current))}
                            onDrop={(event) => {
                              event.preventDefault();
                              void handleDropBefore(item);
                            }}
                          >
                            Buraya birak: ust siraya tasi
                          </div>
                          <button
                            type="button"
                            draggable
                            className={`manual-board-card${item.id === selectedItemId ? " is-selected" : ""}`}
                            style={{
                              background: `linear-gradient(90deg, rgba(31, 122, 77, 0.16) 0%, rgba(31, 122, 77, 0.16) ${item.progressPercent}%, #ffffff ${item.progressPercent}%, #ffffff 100%)`,
                            }}
                            onClick={() => setSelectedItemId(item.id)}
                            onDragStart={(event) => handleDragStart(event, item.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragTargetKey(`child:${item.id}`);
                            }}
                            onDragLeave={() => setDragTargetKey((current) => (current === `child:${item.id}` ? "" : current))}
                            onDrop={(event) => {
                              event.preventDefault();
                              void handleDropAsChild(item);
                            }}
                          >
                            <div className="manual-board-card__head">
                              <strong>{item.title}</strong>
                              <span>%{item.progressPercent}</span>
                            </div>
                            <div className="manual-board-card__meta">
                              <span>{item.status}</span>
                              <span>{assigneeNames || "Atama yok"}</span>
                            </div>
                            <p>{item.content || "Icerik girilmemis."}</p>
                            {dragTargetKey === `child:${item.id}` ? (
                              <div className="manual-board-dropbadge">Birak: alt is yap</div>
                            ) : null}
                          </button>
                        </div>
                      );
                    })}
                    {selectedBoard.items.length > 0 ? (
                      <div
                        className={`manual-board-dropzone manual-board-dropzone--root${dragTargetKey === "root:end" ? " is-active" : ""}`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragTargetKey("root:end");
                        }}
                        onDragLeave={() => setDragTargetKey((current) => (current === "root:end" ? "" : current))}
                        onDrop={(event) => {
                          event.preventDefault();
                          void handleDropToRoot();
                        }}
                      >
                        Buraya birak: kok seviyesine tasi
                      </div>
                    ) : null}
                    {selectedBoard.items.length === 0 ? (
                      <div className="empty-state">Bu panoda henuz is yok. Yeni ana is ile baslayabilirsin.</div>
                    ) : null}
                  </div>
                </section>

                <section className="workspace-panel">
                  <div className="workspace-panel__header">
                    <div>
                      <h3>{selectedItem ? "Secili Is Detayi" : "Detay Paneli"}</h3>
                      <p>Baslik, icerik, durum, parent ve yapacak kisiler bu panelden yonetilir</p>
                    </div>
                    {selectedItem ? (
                      <div className="section-card__action-row">
                        <button type="button" onClick={() => void handleCreateChildItem()} disabled={createItemMutation.isPending}>
                          Alt Is Ekle
                        </button>
                        <button type="button" onClick={() => void handleDeleteItem()} disabled={deleteItemMutation.isPending}>
                          Sil
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {selectedItem ? (
                    <form className="manual-board-editor" onSubmit={handleItemSubmit}>
                      <FormField label="Is basligi">
                        <input
                          value={itemForm.title}
                          onChange={(event) => setItemForm((current) => ({ ...current, title: event.target.value }))}
                          placeholder="Is basligi"
                          required
                        />
                      </FormField>
                      <FormField label="Is icerigi">
                        <input
                          value={itemForm.content}
                          onChange={(event) => setItemForm((current) => ({ ...current, content: event.target.value }))}
                          placeholder="Kisa is icerigi"
                        />
                      </FormField>
                      <FormField label="Durum">
                        <select
                          value={itemForm.status}
                          onChange={(event) =>
                            setItemForm((current) => ({ ...current, status: event.target.value as ManualWorkboardStatus }))
                          }
                        >
                          {manualWorkboardStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Ilerleme">
                        <div className="info-strip manual-board-progress-strip">
                          <strong>%{resolveStatusProgress(itemForm.status)}</strong>
                          <span>Bu alan durum secimine gore otomatik hesaplanir.</span>
                        </div>
                      </FormField>
                      <FormField label="Ust is">
                        <select
                          value={itemForm.parentId}
                          onChange={(event) => setItemForm((current) => ({ ...current, parentId: event.target.value }))}
                        >
                          <option value="">Ana is olarak kalsin</option>
                          {selectedBoard.items
                            .filter((item) => item.id !== selectedItem.id)
                            .filter((item) => !isDescendant(selectedBoard.items, selectedItem.id, item.id))
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {`${"".padStart(item.depth * 2, " ")}${item.title}`}
                              </option>
                            ))}
                        </select>
                      </FormField>
                      <FormField label="Yapacak kisiler">
                        <div className="manual-board-assignee-scope">
                          <label>
                            <input
                              type="radio"
                              name="assignee-scope"
                              checked={itemForm.assigneeScope === "department"}
                              onChange={() => setItemForm((current) => ({ ...current, assigneeScope: "department" }))}
                            />
                            <span>Sadece departman</span>
                          </label>
                          <label>
                            <input
                              type="radio"
                              name="assignee-scope"
                              checked={itemForm.assigneeScope === "all"}
                              onChange={() => setItemForm((current) => ({ ...current, assigneeScope: "all" }))}
                            />
                            <span>Tum kullanicilar</span>
                          </label>
                        </div>
                        <select
                          multiple
                          size={6}
                          value={itemForm.assigneeIds}
                          onChange={(event) => {
                            const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                            setItemForm((current) => ({ ...current, assigneeIds: values }));
                          }}
                        >
                          {users
                            .filter((user) => user.isActive)
                            .filter((user) =>
                              itemForm.assigneeScope === "all"
                              || user.departmentId === selectedBoard.departmentId
                              || Boolean(selectedItem.assigneeIds.includes(user.id)),
                            )
                            .map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.fullName}
                              </option>
                            ))}
                        </select>
                      </FormField>
                      <div className="manual-board-assignee-list">
                        {(selectedItem.assigneeIds.length > 0 ? selectedItem.assigneeIds : itemForm.assigneeIds).map((userId) => (
                          <span key={userId} className="metric-chip">
                            {usersById[userId]?.fullName || userId}
                          </span>
                        ))}
                        {selectedItem.assigneeIds.length === 0 && itemForm.assigneeIds.length === 0 ? (
                          <div className="empty-state">Bu is icin henuz kisi atanmadi.</div>
                        ) : null}
                      </div>
                      <div className="form-actions manual-board-form-actions">
                        <button type="submit" disabled={updateItemMutation.isPending || moveItemMutation.isPending}>
                          {updateItemMutation.isPending || moveItemMutation.isPending ? "Kaydediliyor..." : "Degisikligi Kaydet"}
                        </button>
                        <button type="button" onClick={() => void handleDeleteItem()} disabled={deleteItemMutation.isPending}>
                          Isi Sil
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="empty-state">Soldaki kart listesinden bir is secildiginde detay paneli burada acilir.</div>
                  )}
                </section>
              </div>
            ) : (
              <div className="empty-state">Sol rail tarafindan bir pano sec veya yeni pano olustur.</div>
            )}
          </SectionCard>
        </div>
      </SplitLayout>
    </PageShell>
  );
}

function resolveStatusProgress(status: ManualWorkboardStatus) {
  if (status === "Hazirlaniyor") {
    return 25;
  }
  if (status === "Devam Ediyor") {
    return 50;
  }
  if (status === "Kontrol Ediliyor") {
    return 75;
  }
  if (status === "Tamamlandi") {
    return 100;
  }
  return 0;
}

function getSiblingItems(items: ManualWorkboardItem[], selectedItem: ManualWorkboardItem) {
  return items
    .filter((item) => (item.parentId || null) === (selectedItem.parentId || null))
    .sort((left, right) => left.orderIndex - right.orderIndex);
}

function isDescendant(items: ManualWorkboardItem[], sourceItemId: string, candidateParentId: string) {
  const queue = [sourceItemId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    for (const item of items) {
      if ((item.parentId || null) !== currentId) {
        continue;
      }

      if (item.id === candidateParentId) {
        return true;
      }

      queue.push(item.id);
    }
  }

  return false;
}

async function refreshSelectedBoard(queryClient: ReturnType<typeof useQueryClient>, boardId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["manualWorkboards", "list"] }),
    queryClient.invalidateQueries({ queryKey: ["manualWorkboards", "detail", boardId] }),
  ]);
}
