import {
  AspectRatio,
  Container,
  Divider,
  Paper,
  ScrollArea,
  useMantineTheme,
} from '@mantine/core'
import { Allotment } from 'allotment'
import { endOfDay } from 'date-fns/endOfDay'
import { parse } from 'date-fns/parse'
import { startOfDay } from 'date-fns/startOfDay'
import { useSearchParams } from 'react-router-dom'
import DailyHabitEntries from '../../containers/DailyHabitEntries'
import DailyWeatherOverviewContainer from '../../containers/DailyWeatherOverviewContainer'
import DiaryEntryContainer from '../../containers/DiaryEntryContainer'
import HeatmapContainer from '../../containers/HeatmapContainer'
import classes from './Home.module.css'

function Home() {
  const [searchParams] = useSearchParams()
  const daySearchParam = searchParams.get('day')
  const urlDayFormat = 'yyyy-MM-dd'
  const day = daySearchParam
    ? startOfDay(parse(daySearchParam, urlDayFormat, new Date()))
    : startOfDay(new Date())

  const theme = useMantineTheme()
  return (
    <Paper component={Container} fluid h={'100vh'} bg={theme.colors.dark[9]}>
      <Allotment className={classes.splitPane}>
        <Allotment.Pane preferredSize={'75%'}>
          <ScrollArea
            h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
            type="never"
          >
            <Container className={classes.diaryEntry} pt={'md'} pb={'md'}>
              <DiaryEntryContainer date={day} />
            </Container>
          </ScrollArea>
        </Allotment.Pane>
        <Allotment.Pane preferredSize={'25%'}>
          <ScrollArea
            h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
            type="never"
          >
            <Container fluid pt={'md'} pr={0}>
              <AspectRatio ratio={1} className={classes.map}>
                <HeatmapContainer
                  startDate={startOfDay(day)}
                  endDate={endOfDay(day)}
                />
              </AspectRatio>
              <Divider my="md" />
              <DailyHabitEntries date={day} />
              <Container pl={0} pt={'xl'} fluid>
                <DailyWeatherOverviewContainer date={day} />
              </Container>
            </Container>
          </ScrollArea>
        </Allotment.Pane>
      </Allotment>
    </Paper>
  )
}

export default Home
