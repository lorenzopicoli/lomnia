import { createTheme, rem } from "@mantine/core";

export const cardDarkBackground = "rgba(43,45,66, 0.5)";
export const mantineTheme = createTheme({
  colors: {
    violet: [
      "#f2efff",
      "#e0dcf5",
      "#beb6e4",
      "#9a8ed4",
      "#7c6cc7",
      "#6957bf",
      "#5f4cbc",
      "#5441b0",
      "#463695",
      "#3b2d84",
    ],
    dark: [
      "#e0ded8",
      "#c7c4bd",
      "#aca9a2",
      "#84807a",
      "#696661",
      "#504d48",
      "#403d39",
      "#2e2c29",
      "#1b1a18",
      "#0a0908",
    ],
  },
  primaryColor: "violet",
  cursorType: "pointer",
  fontFamily: "JetBrains Mono",
  fontFamilyMonospace: "JetBrains Mono",

  focusRing: "auto",

  headings: {
    fontFamily: "JetBrains Mono, monospace",
    sizes: {
      h1: { fontSize: rem(36) },
    },
  },
});
