import type { PropsWithChildren, ReactNode } from "react";

type PageShellProps = PropsWithChildren<{
  title: string;
  description: string;
  actions?: ReactNode;
}>;

export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <section className="page-shell">
      <header className="page-shell__header">
        <div>
          <p className="page-shell__eyebrow">new architecture shell</p>
          <h1>{title}</h1>
          <p className="page-shell__description">{description}</p>
        </div>
        {actions ? <div className="page-shell__actions">{actions}</div> : null}
      </header>
      <div className="page-shell__body">{children}</div>
    </section>
  );
}
