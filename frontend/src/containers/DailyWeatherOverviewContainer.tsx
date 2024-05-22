import { ResponsiveLine } from '@nivo/line'
import { format } from 'date-fns/format'
import { parseISO } from 'date-fns/parseISO'
import { startOfDay } from 'date-fns/startOfDay'
import { trpc } from '../api/trpc'

export type DailyWeatherOverviewContainerProps = {
  date: Date
}

export default function DailyWeatherOverviewContainer(
  props: DailyWeatherOverviewContainerProps
) {
  const { data, isLoading } = trpc.getWeatherByDay.useQuery({
    day: format(startOfDay(props.date), 'yyyy-MM-dd'),
  })

  if (isLoading) {
    return 'Loading...'
  }

  if (!data) {
    return 'No data'
  }

  const lineData = data.hourly.reduce(
    (acc, curr) => {
      acc[0].data.push({
        x: format(parseISO(curr.date), 'HH:mm'),
        y: curr.apparentTemperature,
      })
      return acc
    },
    [
      {
        id: 'apparentTemperature',
        color: 'hsl(291, 70%, 50%)',
        data: [] as Array<{ x: string; y: number | null }>,
      },
    ]
  )

  return (
    <>
      <ResponsiveLine
        data={lineData}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: true,
          reverse: false,
        }}
        curve="natural"
        colors={{ scheme: 'pastel1' }}
        pointColor={{ theme: 'background' }}
        enableArea={true}
      />
      {/* <Flex gap={'md'} maw={'100%'} wrap={'wrap'}>
        <Center m="md">
          <IconTemperaturePlus />
          <Space w={20} />
          {data.daily.apparentTemperatureMax}
        </Center>
        <Center m="md">
          <IconTemperatureMinus />
          <Space w={20} />
          {data.daily.apparentTemperatureMin}
        </Center>
        <Center m="md">
          <IconSunrise />
          <Space w={20} />
          {data.daily.sunrise}
        </Center>
        <Center m="md">
          <IconSunset />
          <Space w={20} />
          {data.daily.sunset}
        </Center>
      </Flex> */}
    </>
  )
}
