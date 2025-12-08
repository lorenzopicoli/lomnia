import { useDebouncedCallback } from "@mantine/hooks";
import { omitBy } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Layout, Layouts } from "react-grid-layout";
import type { RouterOutputs } from "../api/trpc";
import type { ResizableGridProps } from "../components/ResizableGrid/ResizableGrid";
import type { ChartAreaConfig } from "./types";

type ChartLayout = {
  [breakpoint: string]: Layout[];
};

export const emptyDashboardContent = {
  idToChart: {},
  placement: { lg: [], md: [], sm: [], xs: [], xxs: [] },
} as BackendDashboardLayout;

interface DashboardLayout {
  idToChart: { [key: string]: ChartAreaConfig };
  placement: ChartLayout;
}
export type BackendDashboardLayout = RouterOutputs["dashboards"]["get"]["content"];

/**
 *
 * Manages and persists the chart grid and configuration
 *
 * @param authorativeContent the content from the backend. This hook only handles managing the data
 * @param saveChanges callback to update the backend on changes
 * @returns isChangingLayout - true if the user is in the process of moving or resizing tiles
 * @returns onAddCharts - function to be called to add charts to the grid. It'll automatically
 * add them to the bottom of the gird
 * @returns onRemoveChart - function to be called to remove a chart. Use the same id used to add it
 * @returns chartsBeingShow - an object of { chartId: ChartConfig }. This can be used to see what charts
 * are currently in the grid and also to actually get the config necessary to display them
 * @returns layout - exposes the object that gets saved in the local storage
 * @returns gridProps - props that should be passed as is to the underlying react-grid-layout
 */
export function useChartGridLayout(
  authorativeContent: BackendDashboardLayout | null,
  saveChanges?: (layout: BackendDashboardLayout) => void,
): {
  isChangingLayout: boolean;
  onAddCharts: (charts: ChartAreaConfig[]) => void;
  onRemoveChart: (chartUniqueId: string) => void;
  chartsBeingShown: { [key: string]: ChartAreaConfig };
  layout: DashboardLayout;
  gridProps: Pick<
    ResizableGridProps,
    "layout" | "onLayoutChange" | "onDragStart" | "onDragStop" | "onResizeStart" | "onResizeStop"
  >;
} {
  const [layout, setLayout] = useState<DashboardLayout>(
    (authorativeContent as DashboardLayout) ?? emptyDashboardContent,
  );

  // Sync layout when authorativeContent changes
  // realistically, whenever the server results update, we also update the local state which does the
  // optimistic update
  useEffect(() => {
    if (authorativeContent) {
      setLayout(authorativeContent as DashboardLayout);
    }
  }, [authorativeContent]);

  const [isChangingLayout, setIsChangingLayout] = useState<boolean>(false);
  const debouncedSaveChanges = useDebouncedCallback(async (layout: DashboardLayout) => {
    saveChanges?.(layout as BackendDashboardLayout);
  }, 500);

  const onLayoutChange: ResizableGridProps["onLayoutChange"] = useCallback(
    (_currentLayout: Layout[], newLayout: Layouts) => {
      const resultingLayout = { idToChart: layout.idToChart, placement: newLayout };
      setLayout(resultingLayout);
      debouncedSaveChanges?.(resultingLayout);
    },
    [layout.idToChart, layout, debouncedSaveChanges],
  );
  const handleStopGridChange = useCallback(() => {
    setIsChangingLayout(false);
  }, []);

  const handleStartGridChange = useCallback(() => setIsChangingLayout(true), []);
  const onRemoveChart = useCallback(
    (uniqueId: string) => {
      const newLayout: ChartLayout = {};
      for (const bp of Object.keys(layout.placement)) {
        for (const l of layout.placement[bp]) {
          if (!newLayout[bp]) {
            newLayout[bp] = [];
          }
          if (l.i === uniqueId) {
            continue;
          }
          newLayout[bp] = [...newLayout[bp], l];
        }
      }

      const result = {
        idToChart: omitBy(layout.idToChart, (o) => o.uniqueId === uniqueId),
        placement: newLayout,
      };
      setLayout(result);
      debouncedSaveChanges?.(result);
    },
    [layout, debouncedSaveChanges],
  );
  const onAddCharts = useCallback(
    (charts: ChartAreaConfig[]) => {
      const newIdToCharts = { ...layout.idToChart };
      for (const chart of charts) {
        if (newIdToCharts[chart.uniqueId]) {
          throw new Error("Detected duplicated chart id");
        }
        newIdToCharts[chart.uniqueId] = chart;
      }
      const newLayout: ChartLayout = {};
      for (const bp of Object.keys(layout.placement)) {
        let lastElement =
          layout.placement[bp].length > 0
            ? layout.placement[bp].reduce((last, curr) => {
                if (curr.y > last.y) {
                  return curr;
                }
                if (curr.y === last.y) {
                  return curr.x > last.x ? curr : last;
                }
                return last;
              })
            : undefined;

        newLayout[bp] = [...(layout.placement[bp] ?? [])];

        for (const newChart of charts) {
          const defaultWidth = 6;
          let newPane: Layout = {
            i: newChart.uniqueId,
            x: 0,
            y: 0,
            w: defaultWidth,
            h: 4,
          };

          if (lastElement) {
            const spaceLeftInRow = 12 - lastElement.x - lastElement.w;
            const shouldTakeNewRow = defaultWidth > spaceLeftInRow;
            newPane = {
              i: newChart.uniqueId,
              x: shouldTakeNewRow ? 0 : lastElement.x + lastElement.w,
              y: shouldTakeNewRow ? lastElement.y + 1 : lastElement.y,
              w: defaultWidth,
              h: 4,
            };
          }

          newLayout[bp].push(newPane);
          lastElement = newPane;
        }
      }
      const result = { idToChart: newIdToCharts, placement: newLayout };
      setLayout(result);
      debouncedSaveChanges?.(result);
    },
    [layout, debouncedSaveChanges],
  );
  const gridLayout = useMemo(() => {
    return layout.placement;
  }, [layout.placement]);

  const chartsBeingShown = useMemo(() => {
    return layout.idToChart;
  }, [layout.idToChart]);

  const gridProps = useMemo(
    () => ({
      layout: gridLayout,
      onLayoutChange,
      onDragStart: handleStartGridChange,
      onDragStop: handleStopGridChange,
      onResizeStart: handleStartGridChange,
      onResizeStop: handleStopGridChange,
    }),
    [gridLayout, handleStartGridChange, handleStopGridChange, onLayoutChange],
  );

  return useMemo(
    () => ({
      isChangingLayout,
      onAddCharts,
      onRemoveChart,
      chartsBeingShown,
      layout,
      gridProps,
    }),
    [isChangingLayout, onAddCharts, onRemoveChart, chartsBeingShown, layout, gridProps],
  );
}
