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
import { ResizableGrid } from '../../components/ResizableGrid/ResizableGrid'
import { getWeatherChart, type WeatherChart } from '../../charts/weatherCharts'
import { ChartSource, type Chart, type LineData } from '../../charts/charts'
import { useDisclosure } from '@mantine/hooks'
import { ExploreSettings } from '../../components/ExploreSettings/ExploreSettings'
import { removeNills } from '../../utils/removeNils'
import { IconFilter } from '@tabler/icons-react'
import { getHabitLineChart } from '../../charts/habitCharts'

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
      .filter(removeNills) as { data: object[]; lines: LineData<object>[] }[]
  }, [weatherData, chartsToShow, habitsData])

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
            <ExploreSettings opened={opened} onSave={handleSettingsChange} />
          </Modal>
          <Flex justify={'flex-end'}>
            <ActionIcon onClick={open} variant="light" size={'lg'}>
              <IconFilter />
            </ActionIcon>
          </Flex>
          {charts.length > 0 ? (
            <EventEmitterProvider>
              <ResizableGrid layout={layout} rowHeight={500}>
                {charts.map((chart, i) => (
                  <div key={i}>
                    {chart.lines[0].labels.description}
                    <DataProvider
                      xScale={{ type: 'time' }}
                      yScale={{ type: 'linear' }}
                    >
                      <SingleSourceLineChart
                        data={chart.data}
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
