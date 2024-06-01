import {
  Container,
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
import { ResizableGrid } from '../../components/ResizableGrid/ResizableGrid'
import { getWeatherChart, type WeatherChart } from '../../charts/weatherCharts'
import { ChartSource, type Chart, type LineData } from '../../charts/charts'
import { useDisclosure } from '@mantine/hooks'
import { removeNills } from '../../utils/removeNils'
import { getHabitLineChart } from '../../charts/habitCharts'
import { AddChart } from '../../components/AddChart/AddChart'
import { useChartGridLayout } from '../../charts/useChartGridLayout'
import { ChartMenu } from '../../components/ChartMenu/ChartMenu'

const chartBgColor = 'rgb(0,0,0,0.3)'
const chartMargin = { top: 40, right: 30, bottom: 50, left: 40 }

export function Explore() {
  const theme = useMantineTheme()
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfMonth(new Date()),
    endOfMonth(new Date()),
  ])
  const [opened, { open, close }] = useDisclosure(false)
  const {
    chartsBeingShown,
    onAddCharts,
    onRemoveChart,
    isChangingLayout,
    gridProps,
  } = useChartGridLayout('explore')
  const handleAddChart = (charts: Chart[]) => {
    onAddCharts(charts)
    close()
  }
  const { data: weatherData } = trpc.getWeatherAnalytics.useQuery(
    {
      startDate: dateRange[0].toISOString(),
      endDate: dateRange[1].toISOString(),
    },
    {
      enabled: chartsBeingShown.some((c) => c.source === ChartSource.Weather),
      initialData: [],
    }
  )
  const { data: habitsData } = trpc.getHabitAnalytics.useQuery(
    {
      startDate: dateRange[0].toISOString(),
      endDate: dateRange[1].toISOString(),
      keys: chartsBeingShown
        .filter((c) => c.source === ChartSource.Habit)
        .map((c) => c.id),
    },
    {
      enabled: chartsBeingShown.some((c) => c.source === ChartSource.Habit),
      initialData: [],
    }
  )

  const charts = useMemo(() => {
    return chartsBeingShown
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
  }, [chartsBeingShown, habitsData, weatherData])

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
            selectedCharts={chartsBeingShown}
            onRemoveChart={onRemoveChart}
            currentRange={dateRange}
            onDateChange={setDateRange}
            onNewChart={() => open()}
          />
          <EventEmitterProvider>
            <ResizableGrid {...gridProps} rowHeight={500}>
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
