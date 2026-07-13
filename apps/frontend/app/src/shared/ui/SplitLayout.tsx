import type { PropsWithChildren, ReactNode } from "react";

type SplitLayoutProps = PropsWithChildren<{
  rail: ReactNode;
}>;

export function SplitLayout({ rail, children }: SplitLayoutProps) {
  return (
    <div className="split-layout">
      <aside className="split-layout__rail">{rail}</aside>
      <div className="split-layout__content">{children}</div>
    </div>
  );
}
