import { trpc } from '../api/trpc'
import { ChartSource, ChartType, type ChartOption } from './charts'

export function useAvailableCharts(): {
  group: string
  items: ChartOption[]
}[] {
  const { data } = trpc.getLineCharts.useQuery(undefined, {
    initialData: { habits: [], weather: [] },
  })

  return [
    {
      group: 'Weather',
      items: data.weather.map((item) => ({
        value: item.key,
        label: item.description,
        data: {
          type: ChartType.LineChart,
          source: ChartSource.Weather,
          id: item.key,
          title: item.description,
        },
      })),
    },
    {
      group: 'Habits',
      items: data.habits.map((item) => ({
        value: item.key,
        label: item.description,
        data: {
          type: ChartType.LineChart,
          source: ChartSource.Habit,
          id: item.key,
          title: item.description,
        },
      })),
    },
  ]
}
