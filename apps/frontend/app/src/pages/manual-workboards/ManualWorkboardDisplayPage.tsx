import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getManualWorkboardDetail } from "@/entities/manual-workboards/api/manual-workboards-api";
import { subscribeManualWorkboardLiveEvents } from "@/entities/manual-workboards/lib/live-updates";
import { useAuthSession } from "@/entities/auth/hooks/useAuthSession";
import { StatusBanner } from "@/shared/ui/StatusBanner";

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ManualWorkboardDisplayPage() {
  const { boardId = "" } = useParams();
  const authQuery = useAuthSession();
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const boardQuery = useQuery({
    queryKey: ["manualWorkboards", "display", boardId],
    queryFn: () => getManualWorkboardDetail(boardId),
    enabled: Boolean(boardId),
    refetchInterval: 5_000,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
  const board = boardQuery.data || null;
  const filteredItems = (board?.items || []).filter((item) => {
    if (hideCompleted && item.status === "Tamamlandi") {
      return false;
    }

    if (showOnlyActive && item.status === "Tamamlandi") {
      return false;
    }

    return true;
  });
  const metrics = {
    total: board?.items.length || 0,
    completed: (board?.items || []).filter((item) => item.status === "Tamamlandi").length,
    active: (board?.items || []).filter((item) => item.status !== "Tamamlandi").length,
    updatedAt: formatDateTime(board?.updatedAt),
  };

  useEffect(() => {
    const unsubscribe = subscribeManualWorkboardLiveEvents((event) => {
      if (event.boardId === boardId) {
        void boardQuery.refetch();
      }
    });
    return unsubscribe;
  }, [boardId, boardQuery]);

  if (authQuery.isLoading || boardQuery.isLoading) {
    return <div className="auth-loading">Gosterim ekrani hazirlaniyor...</div>;
  }

  if (!authQuery.data) {
    return <Navigate to="/login" replace />;
  }

  if (!board) {
    return (
      <div className="display-shell">
        <StatusBanner tone="danger">Pano bulunamadi veya yuklenemedi.</StatusBanner>
      </div>
    );
  }

  return (
    <div className="display-shell">
      <header className="display-topbar">
        <div className="display-topbar__identity">
          <p className="page-shell__eyebrow">Fabrika Gosterim Modu</p>
          <h1>{board.name}</h1>
          <p>{board.description || "Bu pano icin aciklama girilmemis."}</p>
        </div>
        <div className="display-topbar__actions">
          <span className="metric-chip">Departman: {board.departmentName || "Yok"}</span>
          <span className="metric-chip">Son guncelleme: {metrics.updatedAt}</span>
          <button type="button" onClick={() => setHideCompleted((current) => !current)}>
            {hideCompleted ? "Tamamlananlari Goster" : "Tamamlananlari Gizle"}
          </button>
          <button type="button" onClick={() => setShowOnlyActive((current) => !current)}>
            {showOnlyActive ? "Tum Kartlar" : "Sadece Aktifler"}
          </button>
          <button type="button" onClick={() => void boardQuery.refetch()}>
            Yenile
          </button>
          <Link to="/manual-workboards">Yonetim Ekranina Don</Link>
        </div>
      </header>

      {boardQuery.isError ? (
        <StatusBanner tone="danger">
          Veri alinirken sorun olustu. Son bilinen veri gosteriliyor olabilir.
        </StatusBanner>
      ) : null}

      <section className="display-summary-grid">
        <article className="display-summary-card">
          <span>Toplam Is</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="display-summary-card">
          <span>Aktif Is</span>
          <strong>{metrics.active}</strong>
        </article>
        <article className="display-summary-card">
          <span>Tamamlanan</span>
          <strong>{metrics.completed}</strong>
        </article>
        <article className="display-summary-card">
          <span>Gosterim Durumu</span>
          <strong>{board.isVisibleOnDisplay ? "Acik" : "Kapali"}</strong>
        </article>
      </section>

      <section className="display-board">
        {filteredItems.map((item) => {
          const assigneeNames = item.assignees.map((assignee) => assignee.fullName).join(", ");
          return (
            <article
              key={item.id}
              className="display-card"
              style={{
                marginLeft: `${item.depth * 32}px`,
                background: `linear-gradient(90deg, rgba(31, 122, 77, 0.18) 0%, rgba(31, 122, 77, 0.18) ${item.progressPercent}%, #ffffff ${item.progressPercent}%, #ffffff 100%)`,
              }}
            >
              <div className="display-card__head">
                <h2>{item.title}</h2>
                <span>%{item.progressPercent}</span>
              </div>
              <div className="display-card__meta">
                <strong>{item.status}</strong>
                <span>{assigneeNames || "Atama yok"}</span>
              </div>
              <p>{item.content || "Icerik girilmemis."}</p>
            </article>
          );
        })}
        {filteredItems.length === 0 ? (
          <div className="empty-state">Secili filtre ile gosterilecek kart bulunmuyor.</div>
        ) : null}
      </section>
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Yok";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(date);
}
