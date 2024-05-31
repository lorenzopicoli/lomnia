import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../api/trpc'
import { ChartSource, ChartType, type Chart, type ChartOption } from './charts'

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
          ],
    [data]
  )
  const chartsById = useMemo(() => {
    const byId: { [key: string]: Chart } = {}
    if (!data) {
      return byId
    }

    data.weather.forEach((i) => {
      byId[i.key] = {
        type: ChartType.LineChart,
        source: ChartSource.Weather,
        id: i.key,
        title: i.description,
      }
    })
    data.habits.forEach((i) => {
      byId[i.key] = {
        type: ChartType.LineChart,
        source: ChartSource.Habit,
        id: i.key,
        title: i.description,
      }
    })

    return byId
  }, [data])
  const response = useMemo(
    () => ({ refetch, availableCharts: groups, chartsById, isLoading }),
    [refetch, groups, chartsById, isLoading]
  )
  return response
}
