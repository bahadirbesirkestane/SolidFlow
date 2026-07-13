import type { PropsWithChildren } from "react";

type DrawerPanelProps = PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
}>;

export function DrawerPanel({ open, title, onClose, children }: DrawerPanelProps) {
  return (
    <>
      <div
        aria-hidden={!open}
        className={`drawer-backdrop${open ? " is-open" : ""}`}
        onClick={onClose}
      />
      <aside aria-hidden={!open} className={`drawer-panel${open ? " is-open" : ""}`}>
        <header className="drawer-panel__header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose}>
            Kapat
          </button>
        </header>
        <div className="drawer-panel__body">{children}</div>
      </aside>
    </>
  );
}
