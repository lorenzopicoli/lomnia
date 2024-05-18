import { Allotment } from 'allotment'
import HeatmapContainer from '../containers/HeatmapContainer'
import classes from './Home.module.css'
import 'allotment/dist/style.css'
import {
  AppShell,
  AspectRatio,
  Container,
  Divider,
  Paper,
  ScrollArea,
  useMantineTheme,
} from '@mantine/core'
import { addDays } from 'date-fns/addDays'
import { endOfDay } from 'date-fns/endOfDay'
import { format } from 'date-fns/format'
import { parse } from 'date-fns/parse'
import { startOfDay } from 'date-fns/startOfDay'
import { subDays } from 'date-fns/subDays'
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import Header from '../components/Header/Header'
import DailyHabitEntries from '../containers/DailyHabitEntries'
import DiaryEntryContainer from '../containers/DiaryEntryContainer'
import { useConfig } from '../utils/useConfig'

function Home() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const daySearchParam = searchParams.get('day')
  const urlDayFormat = 'yyyy-MM-dd'
  const config = useConfig()
  const day = daySearchParam
    ? startOfDay(parse(daySearchParam, urlDayFormat, new Date()))
    : startOfDay(new Date())

  const dayAfter = format(addDays(day, 1), urlDayFormat)
  const dayBefore = format(subDays(day, 1), urlDayFormat)

  const handleNextDay = () => {
    navigate({
      pathname: '',
      search: createSearchParams({
        day: dayAfter,
      }).toString(),
    })
  }
  const handlePreviousDayClick = () => {
    navigate({
      pathname: '',
      search: createSearchParams({
        day: dayBefore,
      }).toString(),
    })
  }

  const handleChangePrivateMode = (mode: boolean) =>
    config.updateConfig({ privateMode: mode })
  const handleSearch = () => null

  const theme = useMantineTheme()
  return (
    <AppShell header={{ height: 60, offset: true }} withBorder={true}>
      <AppShell.Header>
        <Header
          onChangePrivateMode={handleChangePrivateMode}
          onNextDay={handleNextDay}
          onPreviousDay={handlePreviousDayClick}
          currentDate={day}
          onSearch={handleSearch}
          privateMode={config.privateMode}
        />
      </AppShell.Header>
      <AppShell.Main>
        <Paper
          component={Container}
          fluid
          h={'100vh'}
          bg={theme.colors.dark[9]}
        >
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
                </Container>
              </ScrollArea>
            </Allotment.Pane>
          </Allotment>
        </Paper>
      </AppShell.Main>
    </AppShell>
  )
}

export default Home
