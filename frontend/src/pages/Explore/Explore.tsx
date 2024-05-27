import { Container, Paper, ScrollArea, useMantineTheme } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { endOfMonth } from 'date-fns/endOfMonth'
import { startOfMonth } from 'date-fns/startOfMonth'
import { useMemo, useState } from 'react'
import { trpc } from '../../api/trpc'
import { SingleSourceLineChart } from '../../components/charts/LineCharts'
import { DataProvider, EventEmitterProvider } from '@visx/xychart'
import { getMinMax } from '../../utils/getMinMax'
import { ResizableGrid } from '../../components/ResizableGrid/ResizableGrid'
import {
  WEATHER_PLOTTABLE_FIELDS,
  getLineData,
  weatherLineCharts,
  type PlottableWeatherAnalytics,
  type WeatherAnalytics,
} from '../../components/charts/charts'

export function Explore() {
  const theme = useMantineTheme()
  const [value, setValue] = useState<[Date | null, Date | null]>([
    startOfMonth(new Date()),
    endOfMonth(new Date()),
  ])
  const { data } = trpc.getWeatherAnalytics.useQuery(
    {
      startDate: value[0]?.toISOString() ?? '',
      endDate: value[1]?.toISOString() ?? '',
    },
    {
      initialData: [],
      enabled: !!(value[0] && value[1]),
    }
  )
  const charts = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }
    const minMax = getMinMax<WeatherAnalytics, PlottableWeatherAnalytics>(
      data,
      'weather',
      [...WEATHER_PLOTTABLE_FIELDS]
    )

    return WEATHER_PLOTTABLE_FIELDS.map((key) => {
      return {
        data,
        lines: [
          getLineData({
            staticLine: weatherLineCharts[key],
            id: key,
            min: minMax.min[key].entry,
            max: minMax.max[key].entry,
          }),
        ],
      }
    })
  }, [data])

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
          <DatePicker type="range" value={value} onChange={setValue} />
          {data && data.length > 0 ? (
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
