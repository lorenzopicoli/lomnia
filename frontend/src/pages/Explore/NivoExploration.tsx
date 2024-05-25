import { Container, Paper, ScrollArea, useMantineTheme } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { ResponsiveLine } from '@nivo/line'
import { endOfMonth } from 'date-fns/endOfMonth'
import { startOfMonth } from 'date-fns/startOfMonth'
import { useMemo, useState } from 'react'
import { trpc } from '../../api/trpc'

export const chartTheme = {
  background: '#ffffff',
  text: {
    fontSize: 11,
    fill: '#333333',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  axis: {
    domain: {
      line: {
        stroke: '#777777',
        strokeWidth: 1,
      },
    },
    legend: {
      text: {
        fontSize: 12,
        fill: '#333333',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
    ticks: {
      line: {
        stroke: '#777777',
        strokeWidth: 1,
      },
      text: {
        fontSize: 11,
        fill: '#333333',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
  },
  grid: {
    line: {
      stroke: '#dddddd',
      strokeWidth: 1,
    },
  },
  legends: {
    title: {
      text: {
        fontSize: 11,
        fill: '#333333',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
    text: {
      fontSize: 11,
      fill: '#333333',
      outlineWidth: 0,
      outlineColor: 'transparent',
    },
    ticks: {
      line: {},
      text: {
        fontSize: 10,
        fill: '#333333',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
  },
  annotations: {
    text: {
      fontSize: 13,
      fill: '#333333',
      outlineWidth: 2,
      outlineColor: '#ffffff',
      outlineOpacity: 1,
    },
    link: {
      stroke: '#000000',
      strokeWidth: 1,
      outlineWidth: 2,
      outlineColor: '#ffffff',
      outlineOpacity: 1,
    },
    outline: {
      stroke: '#000000',
      strokeWidth: 2,
      outlineWidth: 2,
      outlineColor: '#ffffff',
      outlineOpacity: 1,
    },
    symbol: {
      fill: '#000000',
      outlineWidth: 2,
      outlineColor: '#ffffff',
      outlineOpacity: 1,
    },
  },
  tooltip: {
    wrapper: {},
    container: {
      background: '#ffffff',
      color: '#333333',
      fontSize: 12,
    },
    basic: {},
    chip: {},
    table: {},
    tableCell: {},
    tableCellValue: {},
  },
}

export function NivoExploration() {
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
      enabled: !!(value[0] && value[1]),
    }
  )
  const plotData = useMemo(
    () => [
      {
        id: 'apparentTemp',
        data: (data ?? []).map((d) => ({
          // x: format(parseISO(d.date ?? ''), 'dd-MM-yyyy HH:mm'),
          x: d.date ?? new Date().toISOString(),
          y: d.weather.apparentTemperature,
        })),
      },
    ],
    [data]
  )
  const plotData2 = useMemo(
    () => [
      {
        id: 'snowfall',
        data: (data ?? []).map((d) => ({
          // x: format(parseISO(d.date ?? ''), 'dd-MM-yyyy HH:mm'),
          x: d.date ?? new Date().toISOString(),
          y: d.weather.snowfall,
        })),
      },
      {
        id: 'snowDepth',
        data: (data ?? []).map((d) => ({
          // x: format(parseISO(d.date ?? ''), 'dd-MM-yyyy HH:mm'),
          x: d.date ?? new Date().toISOString(),
          y: d.weather.snowDepth,
        })),
      },
    ],
    [data]
  )

  const theme = useMantineTheme()
  return (
    <Paper component={Container} fluid h={'100vh'} bg={theme.colors.dark[9]}>
      <ScrollArea
        h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        type="never"
      >
        <Container fluid pt={'md'} pr={0}>
          <DatePicker type="range" value={value} onChange={setValue} />
          {!data ? null : (
            <div style={{ width: '80vh', height: '30vh' }}>
              <ResponsiveLine
                margin={{
                  top: 50,
                  right: 60,
                  bottom: 50,
                  left: 60,
                }}
                // height={300}
                // width={9000}
                xFormat="time:%Y-%m-%dT%H:%M"
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  // stacked: boolean('stacked', false),
                }}
                xScale={{
                  type: 'time',
                  format: '%Y-%m-%dT%H:%M:%S.%f%Z',
                  useUTC: true,
                  precision: 'hour',
                }}
                curve="monotoneX"
                axisBottom={{
                  format: '%d-%m %H:%M',
                  legendOffset: 100,
                  tickValues: 'every 5 days',
                }}
                axisLeft={{
                  legend: 'Temperature',
                  format: (v) => `${v}°C`,
                }}
                pointBorderColor={{
                  from: 'color',
                  modifiers: [['darker', 0.3]],
                }}
                pointBorderWidth={1}
                //   pointSize={16}
                theme={chartTheme}
                // enableTouchCrosshair
                enablePoints={true}
                // enablePointLabel={true}
                data={plotData}
                isInteractive={true}
                enableArea={true}
                // onMouseMove={handleMouseMove}
                // onMouseLeave={handleMouseLeave}
                useMesh
                animate={false}
              />
            </div>
          )}
          {!data ? null : (
            <div style={{ width: '80vh', height: '30vh' }}>
              <ResponsiveLine
                margin={{
                  top: 50,
                  right: 60,
                  bottom: 50,
                  left: 60,
                }}
                // height={300}
                // width={9000}
                xFormat="time:%Y-%m-%dT%H:%M"
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  // stacked: boolean('stacked', false),
                }}
                xScale={{
                  type: 'time',
                  format: '%Y-%m-%dT%H:%M:%S.%f%Z',
                  useUTC: true,
                  precision: 'hour',
                }}
                curve="monotoneX"
                axisBottom={{
                  format: '%d-%m %H:%M',
                  legendOffset: 100,
                  tickValues: 'every 5 days',
                }}
                axisLeft={{
                  legend: 'Depth/Fall',
                  format: (v) => `${v}cm`,
                }}
                pointBorderColor={{
                  from: 'color',
                  modifiers: [['darker', 0.3]],
                }}
                pointBorderWidth={1}
                //   pointSize={16}
                theme={chartTheme}
                // enableTouchCrosshair
                enablePoints={true}
                // enablePointLabel={true}
                useMesh
                data={plotData2}
                animate={false}
                isInteractive={true}
                // onMouseMove={handleMouseMove}
                // onMouseLeave={handleMouseLeave}
                enableArea={true}
              />
            </div>
          )}
        </Container>
      </ScrollArea>
    </Paper>
  )
}
