import { QueryClientProvider } from "@tanstack/react-query";
// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/code-highlight/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import "maplibre-gl/dist/maplibre-gl.css";
import "allotment/dist/style.css";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import * as echarts from "echarts";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";
import { queryClient } from "./api/trpc";
import { ConfigProvider } from "./contexts/ConfigContext";
import Layout from "./pages/Layout";
import { EchartsThemes } from "./themes/echartsThemes";
import { mantineTheme } from "./themes/mantineThemes";

echarts.registerTheme("default_dark", EchartsThemes.darkDefault);

const router = createBrowserRouter([
  {
    path: "/*",
    element: (
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <Layout />
      </QueryParamProvider>
    ),
  },
]);

function App() {
  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
      <ModalsProvider
        modalProps={{
          styles: {
            content: {
              backgroundColor: "var(--mantine-color-dark-7)",
            },
            header: {
              backgroundColor: "var(--mantine-color-dark-7)",
            },
            body: {
              backgroundColor: "var(--mantine-color-dark-7)",
            },
          },
        }}
      >
        <Notifications color="green" position="top-center" />

        <ConfigProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ConfigProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
