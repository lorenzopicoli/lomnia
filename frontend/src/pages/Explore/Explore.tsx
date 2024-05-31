import {
  Button,
  Container,
  Flex,
  Menu,
  Modal,
  Paper,
  Pill,
  ScrollArea,
  useMantineTheme,
} from '@mantine/core'
import { endOfMonth } from 'date-fns/endOfMonth'
import { startOfMonth } from 'date-fns/startOfMonth'
import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../../api/trpc'
import { SingleSourceLineChart } from '../../components/SingleSourceLineChart/SingleSourceLineCharts'
import { DataProvider, EventEmitterProvider } from '@visx/xychart'
import { ResizableGrid } from '../../components/ResizableGrid/ResizableGrid'
import { getWeatherChart, type WeatherChart } from '../../charts/weatherCharts'
import { ChartSource, type Chart, type LineData } from '../../charts/charts'
import { useDisclosure, useLocalStorage } from '@mantine/hooks'
import { removeNills } from '../../utils/removeNils'
import { getHabitLineChart } from '../../charts/habitCharts'
import { endOfYear, format, startOfYear } from 'date-fns'
import { DatePicker } from '@mantine/dates'
import { startOfWeek } from 'date-fns/startOfWeek'
import { subWeeks } from 'date-fns/subWeeks'
import { endOfWeek } from 'date-fns/endOfWeek'
import { subMonths } from 'date-fns/subMonths'
import { subYears } from 'date-fns/subYears'
import { subHours } from 'date-fns/subHours'
import { AddChart } from '../../components/AddChart/AddChart'
import { Layouts, type Layout } from 'react-grid-layout'
import { useAvailableCharts } from '../../charts/useAvailableCharts'

const chartBgColor = 'rgb(0,0,0,0.3)'
const chartMargin = { top: 40, right: 30, bottom: 50, left: 40 }

type ChartLayoutItem = {
  chart: Chart
  placement: Layout
}

type ChartLayout = {
  [breakpoint: string]: ChartLayoutItem[]
}

export function Explore() {
  const theme = useMantineTheme()
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfMonth(new Date()),
    endOfMonth(new Date()),
  ])
  const [isChangingLayout, setIsChangingLayout] = useState<boolean>(false)
  const [opened, { open, close }] = useDisclosure(false)
  const [layout, setLayout] = useLocalStorage({
    key: 'explore-layout',
    defaultValue: { lg: [], md: [], sm: [], xs: [], xxs: [] } as ChartLayout,
  })
  const chartsToShow = useMemo(() => {
    return Object.values(layout)[0].map((l) => l.chart)
  }, [layout])
  const { chartsById, isLoading: isLoadingAvailableCharts } =
    useAvailableCharts()
  const handleLayoutChange = (_currentLayout: Layout[], newLayout: Layouts) => {
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
  }
  const handleStopGridChange = () => setIsChangingLayout(false)
  const handleStartGridChange = () => setIsChangingLayout(true)

  const handleAddChart = (charts: Chart[]) => {
    const newCharts = charts.filter(
      (item) => !chartsToShow.some((c) => item.id === c.id)
    )
    const newLayout: ChartLayout = {}
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
    close()
  }
  const { data: weatherData } = trpc.getWeatherAnalytics.useQuery(
    {
      startDate: dateRange[0].toISOString(),
      endDate: dateRange[1].toISOString(),
    },
    {
      enabled: chartsToShow.some((c) => c.source === ChartSource.Weather),
      initialData: [],
    }
  )
  const { data: habitsData } = trpc.getHabitAnalytics.useQuery(
    {
      startDate: dateRange[0].toISOString(),
      endDate: dateRange[1].toISOString(),
      keys: chartsToShow
        .filter((c) => c.source === ChartSource.Habit)
        .map((c) => c.id),
    },
    {
      enabled: chartsToShow.some((c) => c.source === ChartSource.Habit),
      initialData: [],
    }
  )

  const charts = useMemo(() => {
    return chartsToShow
      .map((chart) => {
        switch (chart.source) {
          case ChartSource.Habit:
            return getHabitLineChart(habitsData, chart)
          case ChartSource.Weather:
            return getWeatherChart(weatherData, chart as WeatherChart)
        }
      })
      .filter(removeNills) as {
      id: string
      data: object[]
      lines: LineData<object>[]
    }[]
  }, [weatherData, chartsToShow, habitsData])

  const gridLayout = useMemo(() => {
    return Object.keys(layout).reduce((acc, curr) => {
      acc[curr] = layout[curr].map((c) => c.placement)
      return acc
    }, {} as Layouts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(layout)])

  return (
    <Paper component={Container} fluid h={'100vh'} bg={theme.colors.dark[9]}>
      <ScrollArea
        h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        type="never"
      >
        <Container
          fluid
          pt={'md'}
          pr={0}
          pl={0}
          m={0}
          style={{ position: 'relative' }}
        >
          <Modal
            opened={opened}
            onClose={close}
            title="Analytics Settings"
            size={'auto'}
          >
            <AddChart opened={opened} onSave={handleAddChart} />
          </Modal>
          <ChartMenu
            selectedCharts={chartsToShow}
            currentRange={dateRange}
            onDateChange={setDateRange}
            onNewChart={() => open()}
          />
          <EventEmitterProvider>
            <ResizableGrid
              onLayoutChange={handleLayoutChange}
              onDragStart={handleStartGridChange}
              onResizeStart={handleStartGridChange}
              onDragStop={handleStopGridChange}
              onResizeStop={handleStopGridChange}
              layout={gridLayout}
              rowHeight={500}
            >
              {charts.length > 0
                ? charts.map((chart) => (
                    <div key={chart.id}>
                      {isChangingLayout ? (
                        <Container
                          fluid
                          h={'100%'}
                          p={0}
                          bg={theme.colors.dark[8]}
                        >
                          {chart.lines[0].labels.description}
                        </Container>
                      ) : (
                        <DataProvider
                          xScale={{ type: 'time' }}
                          yScale={{ type: 'linear' }}
                        >
                          {chart.lines[0].labels.description}
                          <SingleSourceLineChart
                            data={chart.data}
                            lines={chart.lines}
                            heightOffset={20}
                            backgroundColor={chartBgColor}
                            margin={chartMargin}
                          />
                        </DataProvider>
                      )}
                    </div>
                  ))
                : null}
            </ResizableGrid>
          </EventEmitterProvider>
        </Container>
      </ScrollArea>
    </Paper>
  )
}

function ChartMenu(props: {
  selectedCharts: Chart[]
  currentRange: [Date, Date]
  onDateChange: (range: [Date, Date]) => void
  onNewChart: () => void
}) {
  const [partialDateRange, setPartialDateRange] = useState<
    [Date | null, Date | null]
  >([null, null])
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    setPartialDateRange(dates)
  }
  const handleQuickDatesClick = (
    id: 'week' | '24h' | 'month' | 'year' | 'all'
  ) => {
    let range: [Date, Date]
    switch (id) {
      case 'week':
        range = [
          startOfWeek(subWeeks(new Date(), 1)),
          endOfWeek(subWeeks(new Date(), 1)),
        ]
        break
      case 'month':
        range = [
          startOfMonth(subMonths(new Date(), 1)),
          endOfMonth(subMonths(new Date(), 1)),
        ]
        break
      case 'year':
        range = [
          startOfYear(subYears(new Date(), 1)),
          endOfYear(subYears(new Date(), 1)),
        ]
        break
      case '24h':
        range = [subHours(new Date(), 24), new Date()]
        break
      case 'all':
        range = [subYears(new Date(), 100), new Date()]
        break
    }
    setPartialDateRange(range)
  }
  useEffect(() => {
    if (partialDateRange[0] && partialDateRange[1]) {
      props.onDateChange(partialDateRange as [Date, Date])
    }
  }, [props, partialDateRange])
  return (
    <Menu shadow="md" width={200}>
      <Flex direction={'row'}>
        <Button onClick={props.onNewChart} variant={'subtle'}>
          {/* <IconPlus /> */}
          Add chart
        </Button>
        <Menu.Target>
          <Button variant="subtle">
            {format(props.currentRange[0], 'dd/MM/yyyy HH:mm')} to{' '}
            {format(props.currentRange[1], 'dd/MM/yyyy HH:mm')}
          </Button>
        </Menu.Target>
        <Pill.Group>
          {props.selectedCharts.map((v) => (
            <Pill key={v.id} variant="default" withRemoveButton>
              {v.title}
            </Pill>
          ))}
        </Pill.Group>
      </Flex>

      <Menu.Dropdown w={460}>
        <Flex justify={'space-between'} p={'md'} gap={'md'}>
          <div>
            <Menu.Item onClick={() => handleQuickDatesClick('24h')}>
              Last 24 hours
            </Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick('week')}>
              Last week
            </Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick('month')}>
              Last month
            </Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick('year')}>
              Last year
            </Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick('all')} color="red">
              All
            </Menu.Item>
          </div>
          <DatePicker
            type="range"
            value={partialDateRange}
            onChange={handleDateChange}
          />
        </Flex>
      </Menu.Dropdown>
    </Menu>
  )
}
