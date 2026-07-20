import type { PropsWithChildren, ReactNode } from "react";
import { Grid } from "@mantine/core";

type SplitLayoutProps = PropsWithChildren<{
  rail: ReactNode;
}>;

export function SplitLayout({ rail, children }: SplitLayoutProps) {
  return (
    <Grid className="app-split-layout" gutter="lg">
      <Grid.Col className="app-split-layout__rail" span={{ base: 12, lg: 4, xl: 3 }}>{rail}</Grid.Col>
      <Grid.Col className="app-split-layout__content" span={{ base: 12, lg: 8, xl: 9 }}>{children}</Grid.Col>
    </Grid>
  );
}
