import { trpc } from '../api/trpc'
import { startOfDay } from 'date-fns/startOfDay'
import { endOfDay } from 'date-fns/endOfDay'
import { Timeline } from '@mantine/core'
import { IconLocation } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { isNumber } from '../utils/isNumber'
import { VisitedPlaceTimelineItem } from '../components/VisitedPlaceTimelineItem/VisitedPlaceTimelineItem'

type PlacesVisitedTimelineContainerProps = {
  date: Date
  onFilterChange?: (endDate: Date) => void
}

export default function PlacesVisitedTimelineContainer(
  props: PlacesVisitedTimelineContainerProps
) {
  const { data, isLoading } = trpc.getVisitedPlaces.useQuery({
    startDate: startOfDay(props.date).toISOString(),
    endDate: endOfDay(props.date).toISOString(),
  })
  const [activeIndex, setActiveIndex] = useState<number>(0)

  const handleItemHover = useCallback(
    (index: number) => {
      setActiveIndex(index)
      const itemEndDate = data?.[index].endDate
      if (itemEndDate) {
        props.onFilterChange?.(new Date(itemEndDate))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  )

  if (isLoading) {
    return 'Loading...'
  }

  if (!data) {
    return 'No data'
  }

  return (
    <Timeline
      active={isNumber(activeIndex) ? activeIndex : data.length - 1}
      bulletSize={24}
      lineWidth={2}
    >
      {data.map((place, i) => (
        <Timeline.Item
          key={i}
          bullet={<IconLocation size={12} />}
          title={place.placeOfInterest.displayName}
        >
          <VisitedPlaceTimelineItem
            index={i}
            place={place}
            onHovered={handleItemHover}
          />
        </Timeline.Item>
      ))}
    </Timeline>
  )
}
