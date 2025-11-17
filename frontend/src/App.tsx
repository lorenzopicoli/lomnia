import { QueryClientProvider } from "@tanstack/react-query";
// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/code-highlight/styles.css";
import "@mantine/spotlight/styles.css";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import "maplibre-gl/dist/maplibre-gl.css";
import "allotment/dist/style.css";
import { createTheme, MantineProvider, rem } from "@mantine/core";
import * as echarts from "echarts";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { queryClient } from "./api/trpc";
import echartsTheme from "./assets/dark.project.json";
import { ConfigProvider } from "./contexts/ConfigContext";
import Layout from "./pages/Layout";

const theme = createTheme({
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

echarts.registerTheme("my_theme", echartsTheme.theme);

const router = createBrowserRouter([
  {
    path: "/*",
    element: <Layout />,
  },
]);

function App() {
  return (
    <ConfigProvider>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <RouterProvider router={router} />
        </MantineProvider>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
