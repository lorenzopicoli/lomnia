import {
  Container,
  Flex,
  Grid,
  Paper,
  ScrollArea,
  useMantineTheme,
} from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { endOfMonth } from 'date-fns/endOfMonth'
import { startOfMonth } from 'date-fns/startOfMonth'
import { useMemo, useRef, useState } from 'react'
import { trpc, type RouterOutputs } from '../../api/trpc'
import { SingleSourceLineChart } from '../../charts/LineCharts'
import { DataProvider, EventEmitterProvider } from '@visx/xychart'
import { getMinMax } from '../../utils/getMinMax'
import { IconGripVertical } from '@tabler/icons-react'

type WeatherAnalytics = RouterOutputs['getWeatherAnalytics'][number]
const ALL_PLOTTABLE_FIELDS = [
  'apparentTemperature',
  'temperature2m',
  'snowfall',
  'snowDepth',
] as const
type PlottableWeatherAnalytics = Pick<
  WeatherAnalytics['weather'],
  (typeof ALL_PLOTTABLE_FIELDS)[number]
>
const getSnowFall = (entry: WeatherAnalytics) => entry.weather.snowfall ?? 0
const getSnowDepth = (entry: WeatherAnalytics) => entry.weather.snowDepth ?? 0
const getTemp2m = (entry: WeatherAnalytics) => entry.weather.temperature2m ?? 0
const getApparentTemp = (entry: WeatherAnalytics) =>
  entry.weather.apparentTemperature ?? 0

const getX = (d: WeatherAnalytics) => new Date(d.date)
const highestTempLabel = (
  data: WeatherAnalytics,
  unit: string,
  _getX: (data: WeatherAnalytics) => Date,
  getY: (data: WeatherAnalytics) => number
) => `Temperature: ${getY(data).toFixed(1)}${unit}`
const lowestTempLabel = (
  data: WeatherAnalytics,
  unit: string,
  _getX: (data: WeatherAnalytics) => Date,
  getY: (data: WeatherAnalytics) => number
) => `Temperature: ${getY(data).toFixed(1)}${unit}`
const lowestDepthLabel = (
  data: WeatherAnalytics,
  unit: string,
  _getX: (data: WeatherAnalytics) => Date,
  getY: (data: WeatherAnalytics) => number
) => `Depth: ${getY(data).toFixed(1)}${unit}`
const highestDepthLabel = (
  data: WeatherAnalytics,
  unit: string,
  _getX: (data: WeatherAnalytics) => Date,
  getY: (data: WeatherAnalytics) => number
) => `Depth: ${getY(data).toFixed(1)}${unit}`
const lowestSnowfall = (
  data: WeatherAnalytics,
  unit: string,
  _getX: (data: WeatherAnalytics) => Date,
  getY: (data: WeatherAnalytics) => number
) => `Snowfall: ${getY(data).toFixed(1)}${unit}`
const highestSnowfall = (
  data: WeatherAnalytics,
  unit: string,
  _getX: (data: WeatherAnalytics) => Date,
  getY: (data: WeatherAnalytics) => number
) => {
  return `Snowfall: ${getY(data).toFixed(1)}${unit}`
}

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

  const minMax = useMemo(
    () =>
      getMinMax<WeatherAnalytics, PlottableWeatherAnalytics>(data, 'weather', [
        ...ALL_PLOTTABLE_FIELDS,
      ]),
    [data]
  )

  console.log('minMAx', minMax)

  const charts =
    !data || data.length === 0
      ? []
      : [
          {
            data,
            lines: [
              {
                id: 'apparentTemp',
                getX,
                getY: getApparentTemp,
                max: minMax.max.apparentTemperature.entry,
                min: minMax.min.apparentTemperature.entry,
                showMinLabel: true,
                showMaxLabel: true,
                labels: {
                  maxLabel: highestTempLabel,
                  minLabel: lowestTempLabel,
                  unit: '°C',
                },
              },
            ],
          },
          {
            data,
            lines: [
              {
                id: 'apparentTempDup',
                getX,
                getY: getApparentTemp,
                max: minMax.max.apparentTemperature.entry,
                min: minMax.min.apparentTemperature.entry,
                showMinLabel: true,
                showMaxLabel: true,
                labels: {
                  maxLabel: highestTempLabel,
                  minLabel: lowestTempLabel,
                  unit: '°C',
                },
              },
              {
                id: 'temp2m',
                getX,
                getY: getTemp2m,
                max: minMax.max.temperature2m.entry,
                min: minMax.min.temperature2m.entry,
                showMinLabel: false,
                showMaxLabel: false,
                labels: {
                  maxLabel: highestTempLabel,
                  minLabel: lowestTempLabel,
                  unit: '°C',
                },
              },
            ],
          },
          {
            data,
            lines: [
              {
                id: 'snowfall',
                getX,
                getY: getSnowFall,
                max: minMax.max.snowfall.entry,
                min: minMax.min.snowfall.entry,
                showMinLabel: false,
                showMaxLabel: true,
                labels: {
                  maxLabel: highestSnowfall,
                  minLabel: lowestSnowfall,
                  unit: 'cm',
                },
              },
            ],
          },
          {
            data,
            lines: [
              {
                id: 'snowDepth',
                getX,
                getY: getSnowDepth,
                max: minMax.max.snowDepth.entry,
                min: minMax.min.snowDepth.entry,
                showMinLabel: false,
                showMaxLabel: true,
                labels: {
                  maxLabel: highestDepthLabel,
                  minLabel: lowestDepthLabel,
                  unit: 'cm',
                },
              },
            ],
          },
        ]
  return (
    <Paper component={Container} fluid h={'100vh'} bg={theme.colors.dark[9]}>
      <ScrollArea
        h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        type="never"
      >
        <Container fluid pt={'md'} pr={0} style={{ position: 'relative' }}>
          <DatePicker type="range" value={value} onChange={setValue} />
          {data && data.length > 0 ? (
            /* Container avoids horizontal scroll bug: https://v6.mantine.dev/core/grid/#negative-margins */
            <Container fluid>
              <Grid gutter={'md'}>
                <EventEmitterProvider>
                  {charts.map((chart, i) => (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <Grid.Col span={6} h={'500px'}>
                      <DataProvider
                        xScale={{ type: 'time' }}
                        yScale={{ type: 'linear' }}
                      >
                        <SingleSourceLineChart<WeatherAnalytics>
                          data={chart.data}
                          lines={chart.lines}
                        />
                      </DataProvider>
                    </Grid.Col>
                  ))}
                </EventEmitterProvider>
              </Grid>
            </Container>
          ) : null}
        </Container>
      </ScrollArea>
    </Paper>
  )
}
