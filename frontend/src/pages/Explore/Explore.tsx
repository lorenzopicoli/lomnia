import { Container, Paper, ScrollArea, useMantineTheme } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { endOfMonth } from 'date-fns/endOfMonth'
import { startOfMonth } from 'date-fns/startOfMonth'
import { forwardRef, useMemo, useState, type Ref } from 'react'
import { trpc, type RouterOutputs } from '../../api/trpc'
import { SingleSourceLineChart } from '../../charts/LineCharts'
import { DataProvider, EventEmitterProvider } from '@visx/xychart'
import { getMinMax } from '../../utils/getMinMax'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { IconBorderCornerSquare } from '@tabler/icons-react'

type WeatherAnalytics = RouterOutputs['getWeatherAnalytics'][number]
const ALL_PLOTTABLE_FIELDS = [
  'apparentTemperature',
  'temperature2m',
  'snowfall',
  'snowDepth',
  'windSpeed100m',
  'windSpeed10m',
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
const getWindSpeed10m = (entry: WeatherAnalytics) =>
  entry.weather.windSpeed10m ?? 0
const getWindSpeed100m = (entry: WeatherAnalytics) =>
  entry.weather.windSpeed100m ?? 0

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

const ResponsiveGridLayout = WidthProvider(Responsive)

const MyHandle = forwardRef((props, ref) => {
  // Can't really find the typing for this
  const { handleAxis, ...restProps } = props as any
  return (
    <div
      ref={ref}
      className={`react-resizable-handle react-resizable-handle-${handleAxis}`}
      {...restProps}
    >
      <IconBorderCornerSquare style={{ transform: 'rotate(-180deg)' }} />
    </div>
  )
})
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
  const layout = [
    { i: '0', x: 0, y: 0, w: 6, h: 1 },
    { i: '1', x: 6, y: 0, w: 6, h: 1 },
    { i: '2', x: 0, y: 1, w: 6, h: 1 },
    { i: '3', x: 6, y: 1, w: 6, h: 1 },
    { i: '4', x: 0, y: 2, w: 6, h: 1 },
    { i: '5', x: 6, y: 2, w: 6, h: 1 },
  ]
  const minMax = useMemo(
    () =>
      getMinMax<WeatherAnalytics, PlottableWeatherAnalytics>(data, 'weather', [
        ...ALL_PLOTTABLE_FIELDS,
      ]),
    [data]
  )

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
                id: 'windSpeed10m',
                getX,
                getY: getWindSpeed10m,
                max: minMax.max.windSpeed10m.entry,
                min: minMax.min.windSpeed10m.entry,
                showMinLabel: false,
                showMaxLabel: false,
                labels: {
                  maxLabel: () => '',
                  minLabel: () => '',
                  unit: 'km/h',
                },
              },
              {
                id: 'windSpeed100m',
                getX,
                getY: getWindSpeed100m,
                max: minMax.max.windSpeed100m.entry,
                min: minMax.min.windSpeed100m.entry,
                showMinLabel: false,
                showMaxLabel: false,
                labels: {
                  maxLabel: () => '',
                  minLabel: () => '',
                  unit: 'km/h',
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
        <Container
          fluid
          pt={'md'}
          pr={0}
          m={0}
          style={{ position: 'relative' }}
        >
          <DatePicker type="range" value={value} onChange={setValue} />
          {data && data.length > 0 ? (
            // The responsive grid has a margin of 10px which acts as a gutter
            // To keep the sides aligned we add those 10px to the max width of the
            // container and add some negative margin on each side
            <Container maw={'calc(100% + 20px)'} m={0} ml={-10} mr={-10} p={0}>
              <EventEmitterProvider>
                <ResponsiveGridLayout
                  className="layout"
                  layouts={{
                    lg: layout,
                    md: layout,
                    sm: layout,
                    xs: layout,
                    xxs: layout,
                  }}
                  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                  rowHeight={500}
                  margin={[10, 10]}
                  width={window.innerWidth + 20}
                  isResizable={true}
                  resizeHandles={['se']}
                  resizeHandle={<MyHandle />}
                >
                  {charts.map((chart, i) => (
                    <div key={i}>
                      <DataProvider
                        xScale={{ type: 'time' }}
                        yScale={{ type: 'linear' }}
                      >
                        <SingleSourceLineChart<WeatherAnalytics>
                          data={chart.data}
                          lines={chart.lines}
                        />
                      </DataProvider>
                    </div>
                  ))}
                </ResponsiveGridLayout>
              </EventEmitterProvider>
            </Container>
          ) : null}
        </Container>
      </ScrollArea>
    </Paper>
  )
}
