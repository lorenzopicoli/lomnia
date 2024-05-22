import { Flex, Grid, ThemeIcon, rem } from '@mantine/core'
import { format } from 'date-fns/format'
import { trpc } from '../api/trpc'
import { Anonymize } from '../components/Anonymize/Anonymize'
import { iconForKey } from '../utils/personal'
import { useConfig } from '../utils/useConfig'

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
  const config = useConfig()
  const { data, isLoading } = trpc.getHabitsByDay.useQuery({
    day: format(props.date, 'yyyy-MM-dd'),
    privateMode: config.privateMode,
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
        {data.map((h) => (
          <Grid.Col key={h.key} span={6}>
            <Flex key={h.key} gap={'sm'}>
              <ThemeIcon size={24} radius="xl" color={getRandomColor()}>
                {iconForKey(h.key ?? '', {
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
