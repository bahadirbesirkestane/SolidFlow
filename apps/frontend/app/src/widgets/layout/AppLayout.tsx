import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  Avatar,
  Badge,
  Box,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconFolderCog,
  IconLayoutBoard,
  IconLogout,
  IconRoute,
  IconSettings,
  IconShield,
  IconUsers,
  IconUserSquare,
} from "@tabler/icons-react";
import { appRoutes } from "@/app/routes/page-config";
import { groupRoutesBySection } from "@/app/routes/route-groups";
import { logout } from "@/entities/auth/api/auth-api";
import { useAuthSession } from "@/entities/auth/hooks/useAuthSession";
import { useFrontendShellConfig } from "@/entities/system/hooks/useFrontendShellConfig";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const queryClient = useQueryClient();
  const authQuery = useAuthSession();
  const availableRoutes = appRoutes.filter((route) => {
    if (!authQuery.data?.role || !route.allowedRoles || route.allowedRoles.length === 0) {
      return true;
    }

    return route.allowedRoles.includes(authQuery.data.role);
  });
  const currentRoute = availableRoutes.find((route) => location.pathname === route.path) || availableRoutes[0] || appRoutes[0];
  const sections = groupRoutesBySection(availableRoutes);
  const shellConfigQuery = useFrontendShellConfig();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.setQueryData(["auth", "session"], null);
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      navigate("/login", { replace: true });
    },
  });
  const shellStateLabel = shellConfigQuery.isLoading
    ? "Shell config yukleniyor"
    : shellConfigQuery.isError
      ? "Shell config hatasi"
      : shellConfigQuery.data?.buildReady
        ? "React shell hazir"
        : "React shell build bekliyor";

  return (
    <AppShell
      className="app-layout"
      header={{ height: 78 }}
      navbar={{
        width: 320,
        breakpoint: "md",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="lg"
    >
      <AppShell.Header className="topbar">
        <Group h="100%" px="lg" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="md" size="sm" />
            <ThemeIcon size={46} radius="md" variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
              SF
            </ThemeIcon>
            <Box className="topbar__identity">
              <Text className="topbar__eyebrow" size="xs" fw={800} tt="uppercase" c="dimmed">
                {currentRoute.section}
              </Text>
              <Title order={3}>{currentRoute.title}</Title>
              <Text size="sm" c="dimmed" visibleFrom="sm">{currentRoute.description}</Text>
            </Box>
          </Group>

          <Group className="topbar__meta" gap="xs" wrap="nowrap">
            <Badge variant="light" visibleFrom="lg">{shellStateLabel}</Badge>
            <Group gap="xs" wrap="nowrap" visibleFrom="sm">
              <Avatar size="sm" radius="xl">{getInitials(authQuery.data?.fullName)}</Avatar>
              <Box>
                <Text size="sm" fw={700} lh={1.15}>{authQuery.data?.fullName || "Oturum yok"}</Text>
                <Text size="xs" c="dimmed" lh={1.15}>{authQuery.data?.role || "anonim"}</Text>
              </Box>
            </Group>
            <Button
              type="button"
              leftSection={<IconLogout size={16} />}
              variant="light"
              color="red"
              onClick={() => logoutMutation.mutate()}
              loading={logoutMutation.isPending}
            >
              Cikis
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="app-layout__sidebar" p="md">
        <Stack gap="lg" h="100%">
          <Group className="brand-block brand-block--sidebar" wrap="nowrap">
            <ThemeIcon className="brand-mark" size={46} radius="md" variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
              SF
            </ThemeIcon>
            <Box className="brand-block__copy">
              <Text fw={800}>SolidFlow</Text>
              <Text size="xs" c="dimmed">Operasyon ve dagitim kontrol merkezi</Text>
            </Box>
          </Group>

          <ScrollArea className="sidebar-nav" offsetScrollbars>
            <Stack gap="md" pb="md">
              {sections.map(({ section, routes }) => (
                <Stack key={section} className="sidebar-section" gap={4}>
                  <Text className="sidebar-section__label" size="xs" fw={800} tt="uppercase" c="dimmed">
                    {section}
                  </Text>
                  {routes.map((route) => {
                    const isActive = location.pathname === route.path;
                    return (
                      <NavLink
                        key={route.key}
                        className={`sidebar-link${isActive ? " is-active" : ""}`}
                        active={isActive}
                        label={route.title}
                        description={route.description}
                        leftSection={resolveRouteIcon(route.key)}
                        variant="light"
                        onClick={() => {
                          navigate(route.path);
                          closeMobile();
                        }}
                      />
                    );
                  })}
                </Stack>
              ))}
            </Stack>
          </ScrollArea>

          <Divider />
          <Text size="xs" c="dimmed">React + Mantine shell aktif. Tum sayfalar ayni layout sistemini kullanir.</Text>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main className="app-layout__main">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

function resolveRouteIcon(routeKey: string) {
  const iconProps = { size: 18, stroke: 1.8 };

  if (routeKey === "dashboard") {
    return <IconDashboard {...iconProps} />;
  }

  if (routeKey === "operations-center" || routeKey === "workflow-builder") {
    return <IconRoute {...iconProps} />;
  }

  if (routeKey === "manual-workboards") {
    return <IconLayoutBoard {...iconProps} />;
  }

  if (routeKey === "file-distribution") {
    return <IconFolderCog {...iconProps} />;
  }

  if (routeKey === "segment-rules" || routeKey === "rules") {
    return <IconSettings {...iconProps} />;
  }

  if (routeKey === "user-management") {
    return <IconUsers {...iconProps} />;
  }

  if (routeKey === "user-workspace") {
    return <IconUserSquare {...iconProps} />;
  }

  return <IconShield {...iconProps} />;
}

function getInitials(value?: string) {
  const parts = String(value || "SF").split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SF";
}
