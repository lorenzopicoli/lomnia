import { useDebouncedState } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { useHeatmapApi } from '../api'
import Heatmap from '../components/Heatmap'
import type MapViewParams from '../types/MapViewParams'

type HeatmapContainerProps = {
  startDate: Date
  endDate: Date
}

export default function HeatmapContainer(props: HeatmapContainerProps) {
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

  const { startDate, endDate } = props

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setFitToBounds(true)
    setIsFirstFetch(false)
  }, [props.startDate, props.endDate])

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
