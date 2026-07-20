import { createTheme, rem } from "@mantine/core";

export const appTheme = createTheme({
  primaryColor: "blue",
  fontFamily: '"Segoe UI Variable", "Aptos", "Segoe UI", sans-serif',
  headings: {
    fontFamily: '"Segoe UI Variable", "Aptos", "Segoe UI", sans-serif',
    fontWeight: "750",
  },
  radius: {
    xs: rem(6),
    sm: rem(10),
    md: rem(14),
    lg: rem(18),
    xl: rem(24),
  },
  defaultRadius: "md",
  colors: {
    solidBlue: [
      "#e8f3ff",
      "#d2e7fb",
      "#a7cff3",
      "#78b5ec",
      "#529fe6",
      "#368fe2",
      "#2387e0",
      "#1274c8",
      "#0867b3",
      "#00599e",
    ],
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
        withBorder: true,
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
      },
    },
  },
});
