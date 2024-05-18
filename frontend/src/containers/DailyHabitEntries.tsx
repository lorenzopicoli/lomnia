import { Flex, Grid, ThemeIcon, rem } from '@mantine/core'
import { endOfDay } from 'date-fns/endOfDay'
import { format } from 'date-fns/format'
import { startOfDay } from 'date-fns/startOfDay'
import { useHabitEntriesApi } from '../api'
import { Anonymize } from '../components/Anonymize/Anonymize'
import { iconForKey } from '../utils/personal'

type DailyHabitEntriesProps = {
  date: Date
}

const getRandomColor = () => {
  const randomValue = () => Math.floor(Math.random() * 128) // Limit range to produce darker colors
  const r = randomValue() + 50
  const g = randomValue() + 50
  const b = randomValue() + 50
  return `rgb(${r}, ${g}, ${b})`
}

export default function DailyHabitEntriesContainer(
  props: DailyHabitEntriesProps
) {
  const { data, isLoading } = useHabitEntriesApi({
    startDate: format(startOfDay(props.date), 'yyyy-MM-dd'),
    endDate: format(endOfDay(props.date), 'yyyy-MM-dd'),
  })

  if (isLoading) {
    return 'Loading...'
  }

  if (!data) {
    return 'No data'
  }

  return (
    <>
      <Grid gutter={'md'}>
        {data.habitEntries.map((h: Record<string, string>) => (
          <Grid.Col key={h.key} span={6}>
            <Flex key={h.key} gap={'sm'}>
              <ThemeIcon size={24} radius="xl" color={getRandomColor()}>
                {iconForKey(h.key, {
                  style: { width: rem(16), height: rem(16) },
                })}
              </ThemeIcon>
              <span>
                <Anonymize>
                  {h.label}
                  {typeof h.value !== 'boolean' ? `: ${h.value}` : ''}
                </Anonymize>
              </span>
            </Flex>
          </Grid.Col>
        ))}
      </Grid>
    </>
  )
}
