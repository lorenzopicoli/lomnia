import { useCallback, useEffect, useMemo, useState } from 'react'
import { trpc } from '../api/trpc'
import { ChartSource, ChartType, type Chart, type ChartOption } from './charts'
import { getRandomBrighterColor } from '../utils/getRandomColor'

export function useAvailableCharts(): {
  refetch: () => void
  isLoading: boolean
  availableCharts: {
    group: string
    items: ChartOption[]
  }[]
  chartsById: { [key: string]: Chart }
} {
  const [alreadyFetched, setAlreadyFetched] = useState(false)
  const { data, isLoading } = trpc.getLineCharts.useQuery(undefined, {
    enabled: !alreadyFetched,
  })

  useEffect(() => {
    if (data && !alreadyFetched) {
      setAlreadyFetched(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  const refetch = useMemo(() => () => setAlreadyFetched(false), [])
  const createChart = useCallback(
    (
      source: ChartSource,
      item: { key: string; description: string }
    ): Chart => ({
      type: ChartType.LineChart,
      source,
      color: getRandomBrighterColor(),
      id: item.key,
      title: item.description,
    }),
    []
  )
  const groups = useMemo(
    () =>
      !data
        ? []
        : [
            {
              group: 'Weather',
              items: data.weather.map((item) => ({
                value: item.key,
                label: item.description,
                data: createChart(ChartSource.Weather, item),
              })),
            },
            {
              group: 'Habits',
              items: data.habits.map((item) => ({
                value: item.key,
                label: item.description,
                data: createChart(ChartSource.Habit, item),
              })),
            },
          ],
    [createChart, data]
  )
  const chartsById = useMemo(() => {
    const byId: { [key: string]: Chart } = {}
    if (!data) {
      return byId
    }

    data.weather.forEach((i) => {
      byId[i.key] = createChart(ChartSource.Weather, i)
    })
    data.habits.forEach((i) => {
      byId[i.key] = createChart(ChartSource.Habit, i)
    })

    return byId
  }, [createChart, data])
  const response = useMemo(
    () => ({ refetch, availableCharts: groups, chartsById, isLoading }),
    [refetch, groups, chartsById, isLoading]
  )
  return response
}
