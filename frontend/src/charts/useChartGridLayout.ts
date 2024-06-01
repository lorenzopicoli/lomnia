import type { Layout, Layouts } from 'react-grid-layout'
import type { Chart } from './charts'
import { useLocalStorage } from '@mantine/hooks'
import { useCallback, useMemo, useState } from 'react'
import { useAvailableCharts } from './useAvailableCharts'
import type { ResizableGridProps } from '../components/ResizableGrid/ResizableGrid'

type ChartLayoutItem = {
  chart: Chart
  placement: Layout
}

type ChartLayout = {
  [breakpoint: string]: ChartLayoutItem[]
}
export function useChartGridLayout(gridId: string): {
  isChangingLayout: boolean
  onAddCharts: (charts: Chart[]) => void
  onRemoveChart: (chart: Chart) => void
  chartsBeingShown: Chart[]
  layout: ChartLayout
  gridProps: Pick<
    ResizableGridProps,
    | 'layout'
    | 'onLayoutChange'
    | 'onDragStart'
    | 'onDragStop'
    | 'onResizeStart'
    | 'onResizeStop'
  >
} {
  const [layout, setLayout] = useLocalStorage({
    key: gridId + '-layout',
    defaultValue: { lg: [], md: [], sm: [], xs: [], xxs: [] } as ChartLayout,
  })
  const [isChangingLayout, setIsChangingLayout] = useState<boolean>(false)
  const { chartsById, isLoading: isLoadingAvailableCharts } =
    useAvailableCharts()

  // Assumes all breakpoints have the same charts
  const chartsBeingShown = useMemo(() => {
    return (
      Object.values(layout)[0]
        ?.sort((a, b) =>
          a.placement.y === b.placement.y
            ? a.placement.x - b.placement.x
            : a.placement.y - b.placement.y
        )
        .map((l) => l.chart) ?? []
    )
  }, [layout])

  const onLayoutChange: ResizableGridProps['onLayoutChange'] = useCallback(
    (_currentLayout: Layout[], newLayout: Layouts) => {
      if (isLoadingAvailableCharts) {
        return
      }
      const formattedNewLayout = Object.keys(newLayout).reduce((acc, curr) => {
        acc[curr] = newLayout[curr].map((c) => ({
          placement: c,
          chart: chartsById[c.i],
        }))
        return acc
      }, {} as ChartLayout)
      setLayout(formattedNewLayout)
    },
    [chartsById, isLoadingAvailableCharts, setLayout]
  )
  const handleStopGridChange = useCallback(() => setIsChangingLayout(false), [])
  const handleStartGridChange = useCallback(() => setIsChangingLayout(true), [])
  const onRemoveChart = useCallback(
    (chart: Chart) => {
      const newLayout: ChartLayout = {}
      for (const bp of Object.keys(layout)) {
        for (const l of layout[bp]) {
          if (!newLayout[bp]) {
            newLayout[bp] = []
          }
          if (l.chart.id === chart.id) {
            continue
          }
          newLayout[bp] = [...newLayout[bp], l]
        }
      }

      setLayout(newLayout)
    },
    [layout, setLayout]
  )
  const onAddCharts = useCallback(
    (charts: Chart[]) => {
      const newCharts = charts.filter(
        (item) => !chartsBeingShown.some((c) => item.id === c.id)
      )
      const newLayout: ChartLayout = {}
      console.log('layout', newLayout)
      for (const bp of Object.keys(layout)) {
        let lastElement =
          layout[bp].length > 0
            ? layout[bp].reduce((last, curr) => {
                if (curr.placement.y > last.placement.y) {
                  return curr
                }
                if (curr.placement.y === last.placement.y) {
                  return curr.placement.x > last.placement.x ? curr : last
                }
                return last
              })
            : undefined

        newLayout[bp] = [...(layout[bp] ?? [])]

        for (const newChart of newCharts) {
          const defaultWidth = 6
          let newPane: ChartLayoutItem = {
            chart: chartsById[newChart.id],
            placement: {
              i: newChart.id,
              x: 0,
              y: 0,
              w: defaultWidth,
              h: 1,
            },
          }

          if (lastElement) {
            const spaceLeftInRow =
              12 - lastElement.placement.x - lastElement.placement.w
            const shouldTakeNewRow = defaultWidth > spaceLeftInRow
            newPane = {
              chart: chartsById[newChart.id],
              placement: {
                i: newChart.id,
                x: shouldTakeNewRow
                  ? 0
                  : lastElement.placement.x + lastElement.placement.w,
                y: shouldTakeNewRow
                  ? lastElement.placement.y + 1
                  : lastElement.placement.y,
                w: defaultWidth,
                h: 1,
              },
            }
          }

          newLayout[bp].push(newPane)
          lastElement = newPane
        }
      }

      setLayout(newLayout)
    },
    [chartsBeingShown, chartsById, layout, setLayout]
  )
  const gridLayout = useMemo(() => {
    return Object.keys(layout).reduce((acc, curr) => {
      acc[curr] = layout[curr].map((c) => c.placement)
      return acc
    }, {} as Layouts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(layout)])

  return useMemo(
    () => ({
      isChangingLayout,
      onAddCharts,
      onRemoveChart,
      chartsBeingShown,
      layout,
      gridProps: {
        layout: gridLayout,
        onLayoutChange,
        onDragStart: handleStartGridChange,
        onDragStop: handleStopGridChange,
        onResizeStart: handleStartGridChange,
        onResizeStop: handleStopGridChange,
      },
    }),
    [
      chartsBeingShown,
      gridLayout,
      onRemoveChart,
      handleStartGridChange,
      handleStopGridChange,
      isChangingLayout,
      layout,
      onAddCharts,
      onLayoutChange,
    ]
  )
}
