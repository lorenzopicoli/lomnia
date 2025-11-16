import { useLocalStorage } from "@mantine/hooks";
import { omitBy } from "lodash";
import { useCallback, useMemo, useState } from "react";
import type { Layout, Layouts } from "react-grid-layout";
import type { ResizableGridProps } from "../components/ResizableGrid/ResizableGrid";
import type { ChartAreaConfig } from "./charts";
import { useAvailableCharts } from "./useAvailableCharts";

type ChartLayout = {
  [breakpoint: string]: Layout[];
};
/**
 *
 * Manages and persists the chart grid and configuration
 *
 * @param gridId A unique identifier to make sure that the stored layout doesn´t conflict
 * @returns isChangingLayout - true if the user is in the process of moving or resizing tiles
 * @returns onAddCustomCharts - function to be called to add charts to the grid. It'll automatically
 * add them to the bottom of the gird
 * @returns onRemoveChart - function to be called to remove a chart. Use the same id used to add it
 * @returns chartsBeingShow - an object of { chartId: ChartConfig }. This can be used to see what charts
 * are currently in the grid and also to actually get the config necessary to display them
 * @returns layout - exposes the object that gets saved in the local storage
 * @returns gridProps - props that should be passed as is to the underlying react-grid-layout
 */
export function useChartGridLayout(gridId: string): {
  isChangingLayout: boolean;
  onAddCustomCharts: (charts: ChartAreaConfig[]) => void;
  onRemoveChart: (chartId: string) => void;
  chartsBeingShown: { [key: string]: ChartAreaConfig };
  layout: {
    idToChart: { [key: string]: ChartAreaConfig };
    placement: ChartLayout;
  };
  gridProps: Pick<
    ResizableGridProps,
    "layout" | "onLayoutChange" | "onDragStart" | "onDragStop" | "onResizeStart" | "onResizeStop"
  >;
} {
  const [layout, setLayout] = useLocalStorage({
    key: `${gridId}-layout`,
    defaultValue: {
      idToChart: {} as { [key: string]: ChartAreaConfig },
      placement: { lg: [], md: [], sm: [], xs: [], xxs: [] } as ChartLayout,
    },
  });
  const [isChangingLayout, setIsChangingLayout] = useState<boolean>(false);
  const { isLoading: isLoadingAvailableCharts } = useAvailableCharts();

  const onLayoutChange: ResizableGridProps["onLayoutChange"] = useCallback(
    (_currentLayout: Layout[], newLayout: Layouts) => {
      if (isLoadingAvailableCharts) {
        return;
      }
      setLayout({ idToChart: layout.idToChart, placement: newLayout });
    },
    [isLoadingAvailableCharts, layout.idToChart, setLayout],
  );
  const handleStopGridChange = useCallback(() => setIsChangingLayout(false), []);
  const handleStartGridChange = useCallback(() => setIsChangingLayout(true), []);
  const onRemoveChart = useCallback(
    (chartId: string) => {
      const newLayout: ChartLayout = {};
      for (const bp of Object.keys(layout.placement)) {
        for (const l of layout.placement[bp]) {
          if (!newLayout[bp]) {
            newLayout[bp] = [];
          }
          if (l.i === chartId) {
            continue;
          }
          newLayout[bp] = [...newLayout[bp], l];
        }
      }

      setLayout({
        idToChart: omitBy(layout.idToChart, (o) => o.id === chartId),
        placement: newLayout,
      });
    },
    [layout, setLayout],
  );
  const onAddCustomCharts = useCallback(
    (charts: ChartAreaConfig[]) => {
      //   const newCharts = charts.filter(
      //     (item) => !chartsBeingShown.some((c) => item.id === c.id)
      //   )
      const newIdToCharts = { ...layout.idToChart };
      for (const chart of charts) {
        if (newIdToCharts[chart.id]) {
          throw new Error("Detected duplicated chart id");
        }
        newIdToCharts[chart.id] = chart;
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
            i: newChart.id,
            x: 0,
            y: 0,
            w: defaultWidth,
            h: 1,
          };

          if (lastElement) {
            const spaceLeftInRow = 12 - lastElement.x - lastElement.w;
            const shouldTakeNewRow = defaultWidth > spaceLeftInRow;
            newPane = {
              i: newChart.id,
              x: shouldTakeNewRow ? 0 : lastElement.x + lastElement.w,
              y: shouldTakeNewRow ? lastElement.y + 1 : lastElement.y,
              w: defaultWidth,
              h: 1,
            };
          }

          newLayout[bp].push(newPane);
          lastElement = newPane;
        }
      }

      setLayout({ idToChart: newIdToCharts, placement: newLayout });
    },
    [layout, setLayout],
  );
  const gridLayout = useMemo(() => {
    return layout.placement;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [, layout.placement]);

  const chartsBeingShown = useMemo(() => {
    return layout.idToChart;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [, layout.idToChart]);

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
      onAddCustomCharts,
      onRemoveChart,
      chartsBeingShown,
      layout,
      gridProps,
    }),
    [isChangingLayout, onAddCustomCharts, onRemoveChart, chartsBeingShown, layout, gridProps],
  );
}
