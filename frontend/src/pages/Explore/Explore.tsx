import {
  Container,
  Grid,
  Paper,
  ScrollArea,
  useMantineTheme,
} from '@mantine/core'
import { DatePicker } from '@mantine/dates'
// import { localPoint } from '@visx/event'
// import { voronoi } from '@visx/voronoi'
import { endOfMonth } from 'date-fns/endOfMonth'
import { startOfMonth } from 'date-fns/startOfMonth'
import { memo, useCallback, useMemo, useState } from 'react'
import { trpc, type RouterOutputs } from '../../api/trpc'
import { DateLineChart } from '../../charts/LineCharts'
import { scaleLinear, scaleTime } from '@visx/scale'
import { extent } from '@visx/vendor/d3-array'
import { isNumber } from '../../utils/isNumber'

type WeatherAnalytics = RouterOutputs['getWeatherAnalytics'][number]
const getSnowFall = (entry: WeatherAnalytics) => entry.weather.snowfall ?? 0
const getSnowDepth = (entry: WeatherAnalytics) => entry.weather.snowDepth ?? 0
const getTemp2m = (entry: WeatherAnalytics) => entry.weather.temperature2m ?? 0
const getApparentTemp = (entry: WeatherAnalytics) =>
  entry.weather.apparentTemperature ?? 0

const getX = (d: WeatherAnalytics) => new Date(d.date)

export function Explore() {
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

  const mins = useMemo(
    () =>
      data?.reduce(
        (acc, curr) => ({
          apparentTemperature:
            isNumber(curr.weather.apparentTemperature) &&
            acc.apparentTemperature > curr.weather.apparentTemperature
              ? curr.weather.apparentTemperature
              : acc.apparentTemperature,

          temperature2m:
            isNumber(curr.weather.temperature2m) &&
            acc.temperature2m > curr.weather.temperature2m
              ? curr.weather.temperature2m
              : acc.temperature2m,
        }),
        {
          apparentTemperature: Number.MAX_SAFE_INTEGER,
          temperature2m: Number.MAX_SAFE_INTEGER,
        }
      ),
    [data]
  )
  const maxs = useMemo(
    () =>
      data?.reduce(
        (acc, curr) => ({
          apparentTemperature:
            isNumber(curr.weather.apparentTemperature) &&
            acc.apparentTemperature < curr.weather.apparentTemperature
              ? curr.weather.apparentTemperature
              : acc.apparentTemperature,

          temperature2m:
            isNumber(curr.weather.temperature2m) &&
            acc.temperature2m < curr.weather.temperature2m
              ? curr.weather.temperature2m
              : acc.temperature2m,
        }),
        {
          apparentTemperature: Number.MIN_SAFE_INTEGER,
          temperature2m: Number.MIN_SAFE_INTEGER,
        }
      ),
    [data]
  )

  // event handlers

  //   const plotData = useMemo(
  //     () => [
  //       {
  //         id: 'apparentTemp',
  //         data: (data ?? []).map((d) => ({
  //           // x: format(parseISO(d.date ?? ''), 'dd-MM-yyyy HH:mm'),
  //           x: d.date ?? new Date().toISOString(),
  //           y: d.weather.apparentTemperature,
  //         })),
  //       },
  //     ],
  //     [data]
  //   )
  console.log('max', maxs, mins)

  const xScale = scaleTime<number>({
    domain: extent(data, getX) as [Date, Date],
  })
  const firstYScale = scaleLinear<number>({
    domain: [mins.apparentTemperature, maxs.apparentTemperature],
  })
  const secondYScale = scaleLinear<number>({
    domain: [
      mins.temperature2m < mins.apparentTemperature
        ? mins.temperature2m
        : mins.apparentTemperature,
      maxs.temperature2m > maxs.apparentTemperature
        ? maxs.temperature2m
        : maxs.apparentTemperature,
    ],
  })

  //   const plotData2 = useMemo(() => {
  //     console.log('memo call')
  //     return [
  //       {
  //         id: 'snowfall',
  //         data: (data ?? []).map((d) => ({
  //           // x: format(parseISO(d.date ?? ''), 'dd-MM-yyyy HH:mm'),
  //           x: d.date ?? new Date().toISOString(),
  //           y: d.weather.snowfall,
  //         })),
  //       },
  //       {
  //         id: 'snowDepth',
  //         data: (data ?? []).map((d) => ({
  //           // x: format(parseISO(d.date ?? ''), 'dd-MM-yyyy HH:mm'),
  //           x: d.date ?? new Date().toISOString(),
  //           y: d.weather.snowDepth,
  //         })),
  //       },
  //     ]
  //   }, [data])

  //   const getNodeSize = useMemo(
  //     () => (node: Omit<ScatterPlotNodeData<SampleDatum>, 'size' | 'color'>) => {
  //       if (nodeId !== null && nodeId === node.id) return 46
  //       return 8
  //     },
  //     [nodeId]
  //   )
  const theme = useMantineTheme()

  return (
    <Paper component={Container} fluid h={'100vh'} bg={theme.colors.dark[9]}>
      <ScrollArea
        h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        type="never"
      >
        <Container fluid pt={'md'} pr={0} style={{ position: 'relative' }}>
          <DatePicker type="range" value={value} onChange={setValue} />
          <div style={{ position: 'relative', maxHeight: '100px' }}>
            <Grid gutter={'md'}>
              <Grid.Col span={6} h={'500px'}>
                <DateLineChart<WeatherAnalytics>
                  data={data}
                  lines={[{ getX, getY: getApparentTemp }]}
                  xScale={xScale}
                  yScale={firstYScale}
                />
              </Grid.Col>
              <Grid.Col span={6} h={'500px'}>
                <DateLineChart<WeatherAnalytics>
                  data={data}
                  lines={[
                    { getX, getY: getApparentTemp },
                    { getX, getY: getTemp2m },
                  ]}
                  xScale={xScale}
                  yScale={secondYScale}
                />
              </Grid.Col>
            </Grid>
          </div>
        </Container>
      </ScrollArea>
    </Paper>
  )
}
