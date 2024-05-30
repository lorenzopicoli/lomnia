import {
  ActionIcon,
  Button,
  Container,
  Flex,
  Menu,
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
import { endOfYear, format, startOfYear } from 'date-fns'
import { DatePicker } from '@mantine/dates'
import { startOfWeek } from 'date-fns/startOfWeek'
import { subWeeks } from 'date-fns/subWeeks'
import { endOfWeek } from 'date-fns/endOfWeek'
import { sub } from 'date-fns/sub'
import { subMonths } from 'date-fns/subMonths'
import { subYears } from 'date-fns/subYears'
import { subHours } from 'date-fns/subHours'

export function Explore() {
  const theme = useMantineTheme()
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfMonth(new Date()),
    endOfMonth(new Date()),
  ])
  const [partialDateRange, setPartialDateRange] = useState<
    [Date | null, Date | null]
  >([null, null])
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
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    setPartialDateRange(dates as [Date, Date])
    if (dates[0] && dates[1]) {
      setDateRange(dates as [Date, Date])
    }
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
    setDateRange(range)
    setPartialDateRange(range)
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
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="light">
                {format(dateRange[0], 'dd/MM/yyyy HH:mm')} to{' '}
                {format(dateRange[1], 'dd/MM/yyyy HH:mm')}
              </Button>
            </Menu.Target>
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
                  <Menu.Item
                    onClick={() => handleQuickDatesClick('all')}
                    color="red"
                  >
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
