import { endOfDay } from 'date-fns/endOfDay'
import { startOfDay } from 'date-fns/startOfDay'
import debounce from 'lodash.debounce'
import { useState } from 'react'
import { useHeatmapApi } from '../api'
import Heatmap from '../components/Heatmap'
import type MapViewParams from '../types/MapViewParams'

export default function HeatmapContainer() {
  const [mapViewParams, setMapViewParams] = useState<MapViewParams>()

  const startDate = startOfDay(new Date())
  const endDate = endOfDay(new Date())
  const { data } = useHeatmapApi({
    ...mapViewParams,
    startDate,
    endDate,
  })

  const handleViewChange = debounce((params: MapViewParams) => {
    setMapViewParams(params)
  }, 500)

  return <Heatmap points={data?.points ?? []} onViewChange={handleViewChange} />
}
