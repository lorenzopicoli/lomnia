import { useDebouncedState } from '@mantine/hooks'
import { endOfDay } from 'date-fns/endOfDay'
import { startOfDay } from 'date-fns/startOfDay'
import { useState } from 'react'
import { useHeatmapApi } from '../api'
import Heatmap from '../components/Heatmap'
import type MapViewParams from '../types/MapViewParams'

export default function HeatmapContainer() {
  const [isFirstFetch, setIsFirstFetch] = useState(false)
  const [fitToBounds, setFitToBounds] = useState(true)
  const [mapViewParams, setMapViewParams] = useDebouncedState<
    MapViewParams | undefined
  >(
    {
      // There are PostGIS limitations. Ideally I'd like to check lng 180 to -180
      // I should just accept null for the first call maybe
      topLeftLat: 85,
      topLeftLng: -90,
      bottomRightLat: -85,
      bottomRightLng: 90,
      zoom: 10,
    },
    500
  )

  const startDate = startOfDay(new Date())
  const endDate = endOfDay(new Date())
  const { data } = useHeatmapApi({
    ...mapViewParams,
    startDate,
    endDate,
  })

  if (data && !isFirstFetch) {
    setIsFirstFetch(true)
  }

  const handleViewChange = (params: MapViewParams) => {
    setFitToBounds(false)
    setMapViewParams(params)
  }

  if (!isFirstFetch || !data) {
    return 'Loading...'
  }

  return (
    <Heatmap
      fitToBounds={fitToBounds}
      points={data.points}
      onViewChange={handleViewChange}
    />
  )
}
