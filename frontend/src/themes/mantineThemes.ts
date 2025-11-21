import { createTheme, rem } from "@mantine/core";

export const cardDarkBackground = "rgba(43,45,66, 0.5)";
export const mantineTheme = createTheme({
  colors: {
    violet: [
      "#f6ecff",
      "#e7d6fb",
      "#caabf1",
      "#ac7ce8",
      "#9354e0",
      "#833cdb",
      "#7b2eda",
      "#6921c2",
      "#5d1cae",
      "#501599",
    ],
    ye: ["#fff8e0", "#ffeeca", "#ffdb99", "#ffc762", "#ffb536", "#ffab18", "#ffa503", "#e49000", "#cb7f00", "#b06d00"],
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
