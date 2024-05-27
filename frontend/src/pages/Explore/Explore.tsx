import {
  ActionIcon,
  Container,
  Flex,
  Modal,
  Paper,
  ScrollArea,
  useMantineTheme,
} from '@mantine/core'
import { endOfMonth } from 'date-fns/endOfMonth'
import { startOfMonth } from 'date-fns/startOfMonth'
import { useMemo, useState } from 'react'
import { trpc } from '../../api/trpc'
import { SingleSourceLineChart } from '../../components/SingleSourceLineChart/SingleSourceLineCharts'
import { DataProvider, EventEmitterProvider } from '@visx/xychart'
import { getMinMax } from '../../utils/getMinMax'
import { ResizableGrid } from '../../components/ResizableGrid/ResizableGrid'
import {
  WEATHER_PLOTTABLE_FIELDS,
  isWeatherChart,
  weatherLineCharts,
  type PlottableWeatherAnalytics,
  type WeatherAnalytics,
} from '../../charts/weatherCharts'
import {
  ChartSource,
  ChartType,
  getLineData,
  type Chart,
} from '../../charts/charts'
import { useDisclosure } from '@mantine/hooks'
import { ExploreSettings } from '../../components/ExploreSettings/ExploreSettings'
import { removeNills } from '../../utils/removeNils'
import { IconFilter } from '@tabler/icons-react'

export function Explore() {
  const theme = useMantineTheme()
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfMonth(new Date()),
    endOfMonth(new Date()),
  ])
  const [chartsToShow, setChartsToShow] = useState<Chart[]>([])
  const [opened, { open, close }] = useDisclosure(false)
  const handleSettingsChange = (
    charts: Chart[],
    newDateRange: [Date, Date]
  ) => {
    setChartsToShow(charts)
    setDateRange(newDateRange)
    close()
  }
  const { data: weatherData } = trpc.getWeatherAnalytics.useQuery(
    {
      startDate: dateRange[0].toISOString() ?? '',
      endDate: dateRange[1].toISOString() ?? '',
    },
    {
      initialData: [],
    }
  )
  const { data: habitsKeys } = trpc.getHabitAnalyticsKeys.useQuery(undefined, {
    initialData: [],
  })

  const charts = useMemo(() => {
    if (!weatherData || weatherData.length === 0) {
      return []
    }
    const minMax = getMinMax<WeatherAnalytics, PlottableWeatherAnalytics>(
      weatherData,
      'weather',
      [...WEATHER_PLOTTABLE_FIELDS]
    )

    return chartsToShow
      .map((chart) => {
        if (isWeatherChart(chart)) {
          return {
            weatherData,
            lines: [
              getLineData({
                staticLine: weatherLineCharts[chart.id],
                id: chart.id,
                min: minMax.min[chart.id].entry,
                max: minMax.max[chart.id].entry,
              }),
            ],
          }
        }
      })
      .filter(removeNills)
  }, [weatherData, chartsToShow])

  const layout = charts.map((_c, i) => {
    const isEven = i % 2 === 0
    return { i: String(i), x: isEven ? 0 : 6, y: Math.floor(i / 2), w: 6, h: 1 }
  })

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
          m={0}
          style={{ position: 'relative' }}
        >
          <Modal
            opened={opened}
            onClose={close}
            title="Analytics Settings"
            size={'auto'}
          >
            <ExploreSettings
              chartOptions={[
                {
                  group: 'Weather',
                  items: Object.keys(weatherLineCharts).map((k) => {
                    const value =
                      weatherLineCharts[k as keyof typeof weatherLineCharts]
                    return {
                      value: k,
                      label: value.labels.description ?? '',
                      data: {
                        id: k,

                        source: ChartSource.Weather,
                        type: ChartType.LineChart,
                      },
                    }
                  }),
                },
                {
                  group: 'Habits',
                  items: habitsKeys.map((k) => ({
                    value: k,
                    label: k,
                    type: ChartType.LineChart,
                    data: {
                      id: k,

                      source: ChartSource.Weather,
                      type: ChartType.LineChart,
                    },
                  })),
                },
              ]}
              opened={opened}
              onSave={handleSettingsChange}
            />
          </Modal>
          <Flex justify={'flex-end'}>
            <ActionIcon onClick={open} variant="light" size={'lg'}>
              <IconFilter />
            </ActionIcon>
          </Flex>
          {weatherData && weatherData.length > 0 ? (
            <EventEmitterProvider>
              <ResizableGrid layout={layout} rowHeight={500}>
                {charts.map((chart, i) => (
                  <div key={i}>
                    {chart.lines[0].labels.description}
                    <DataProvider
                      xScale={{ type: 'time' }}
                      yScale={{ type: 'linear' }}
                    >
                      <SingleSourceLineChart<WeatherAnalytics>
                        data={chart.weatherData}
                        lines={chart.lines}
                        heightOffset={20}
                      />
                    </DataProvider>
                  </div>
                ))}
              </ResizableGrid>
            </EventEmitterProvider>
          ) : null}
        </Container>
      </ScrollArea>
    </Paper>
  )
}
