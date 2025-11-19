import { createTheme, rem } from "@mantine/core";

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
