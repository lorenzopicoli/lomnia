import { Fragment, type ReactElement, useState } from 'react'
import classes from './Home.module.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Allotment } from 'allotment'
import HeatmapContainer from '../containers/HeatmapContainer'
import 'allotment/dist/style.css'
import {
  ActionIcon,
  AppShell,
  AspectRatio,
  Button,
  Center,
  Code,
  Container,
  Flex,
  Input,
  Paper,
  UnstyledButton,
} from '@mantine/core'
import {
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconSearch,
} from '@tabler/icons-react'
import { addDays } from 'date-fns/addDays'
import { endOfDay } from 'date-fns/endOfDay'
import { format } from 'date-fns/format'
import { isFuture } from 'date-fns/isFuture'
import { parse } from 'date-fns/parse'
import { startOfDay } from 'date-fns/startOfDay'
import { subDays } from 'date-fns/subDays'
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import DiaryEntryContainer from '../containers/DiaryEntryContainer'

function Home() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const daySearchParam = searchParams.get('day')
  const urlDayFormat = 'yyyy-MM-dd'
  const day = daySearchParam
    ? startOfDay(parse(daySearchParam, urlDayFormat, new Date()))
    : startOfDay(new Date())
  const [privacyMode, setPrivacyMode] = useState(false)

  const dayAfter = format(addDays(day, 1), urlDayFormat)
  const dayBefore = format(subDays(day, 1), urlDayFormat)

  const formattedDate = format(day, 'MMMM do, yyyy')

  const handleNextDayClick = () => {
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
  return (
    <AppShell header={{ height: 80 }} withBorder={false} padding="md">
      <AppShell.Header p="md">
        <Flex
          component={Container}
          fluid
          justify={'space-between'}
          align={'center'}
        >
          <div>Explore data</div>

          <Flex component={'h2'} gap={'lg'} align={'center'}>
            <UnstyledButton onClick={handlePreviousDayClick}>
              <Center>
                <IconChevronLeft />
              </Center>
            </UnstyledButton>
            {formattedDate}
            {isFuture(addDays(day, 1)) ? null : (
              <UnstyledButton onClick={handleNextDayClick}>
                <Center>
                  <IconChevronRight />
                </Center>
              </UnstyledButton>
            )}
          </Flex>
          <Flex align={'center'} gap="md">
            <Input
              radius={10}
              placeholder="Search..."
              leftSection={<IconSearch size={16} />}
              rightSection={<Code>⌘ + K</Code>}
              rightSectionWidth={80}
            />
            <ActionIcon
              variant={!privacyMode ? 'light' : 'filled'}
              //   color="white"
              size="lg"
              //   style={{ width: '40px' }}
              onClick={() => setPrivacyMode(!privacyMode)}
            >
              {!privacyMode ? <IconEye /> : <IconEyeOff />}
            </ActionIcon>
          </Flex>
        </Flex>
      </AppShell.Header>
      <AppShell.Main>
        <Paper component={Container} fluid h={'100vh'}>
          <Allotment className={classes.splitPane}>
            <Allotment.Pane preferredSize={'75%'}>
              <Container className={classes.diaryEntry} pt={'md'}>
                <DiaryEntryContainer privacyMode={privacyMode} date={day} />
              </Container>
            </Allotment.Pane>
            <Allotment.Pane preferredSize={'25%'}>
              <Container fluid h={'100vh'} pt={'md'} pr={0}>
                <AspectRatio ratio={1} className={classes.map}>
                  <HeatmapContainer
                    startDate={startOfDay(day)}
                    endDate={endOfDay(day)}
                  />
                </AspectRatio>
              </Container>
            </Allotment.Pane>
          </Allotment>
        </Paper>
      </AppShell.Main>
    </AppShell>
  )
}

export default Home

const text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae magna nec massa auctor hendrerit. Maecenas dolor velit, feugiat non rhoncus id, bibendum et tellus. Ut eleifend dapibus pulvinar. Suspendisse turpis tortor, molestie ac posuere vel, maximus et ipsum. Integer pretium odio id luctus ullamcorper. Quisque ipsum felis, sagittis in tempor ut, commodo a dui. Duis egestas dolor in vehicula lobortis. Suspendisse potenti. Duis ut lorem et ipsum tincidunt venenatis. Curabitur elit mi, pretium imperdiet ligula ut, auctor placerat lectus. Etiam feugiat lectus eu vehicula fringilla. Aliquam mi massa, convallis sed odio eget, elementum porttitor dolor. Donec lobortis, magna non posuere tempor, dolor dui eleifend lacus, sed pulvinar neque purus nec leo.

Nam sollicitudin ipsum arcu, quis tincidunt ante vulputate non. Fusce et augue in nunc commodo pulvinar ac eget lacus. Nunc vitae odio vulputate, efficitur metus quis, consequat massa. Pellentesque sed gravida eros. Etiam a orci est. Ut fringilla urna lacus, et bibendum ante ullamcorper et. Donec est sem, faucibus et condimentum nec, tristique id dui. In eu magna suscipit, convallis metus mollis, iaculis quam. Donec pulvinar accumsan convallis.

Aliquam pretium leo a semper cursus. Morbi maximus pellentesque mauris, vel condimentum dolor efficitur a. Sed sed mauris ante. Sed a rhoncus magna. Etiam sapien libero, congue et molestie vitae, consequat non mi. Integer iaculis augue ut scelerisque sodales. Morbi sit amet ante ac ligula pharetra porta et commodo nisi. Aliquam id blandit arcu. Donec efficitur elit nec odio convallis, vel varius erat varius. Vestibulum ac iaculis ex. Ut vel viverra velit. Mauris at suscipit ex. Morbi placerat a est sed posuere. Donec maximus sem et condimentum porttitor.

Nunc in ex euismod libero tincidunt venenatis. Fusce eu mauris at libero auctor iaculis. Sed cursus sed risus sit amet facilisis. Etiam eget erat ac neque sagittis varius sed id elit. Phasellus sit amet ante sit amet nulla cursus feugiat. Donec sit amet ultricies leo, a placerat dui. In hac habitasse platea dictumst. Proin eget odio vitae lectus malesuada sagittis eget sit amet odio.

In aliquet consequat dui et condimentum. Etiam bibendum orci sed dictum rutrum. Maecenas eget erat a est posuere vestibulum in at tortor. Phasellus non metus porttitor, euismod massa in, porta ex. Integer neque felis, laoreet ut est nec, tincidunt blandit lectus. Integer molestie est sit amet lobortis malesuada. Duis ut libero tincidunt est euismod tincidunt eget dapibus odio. Praesent at nibh magna. Proin at metus sit amet erat porttitor blandit. Suspendisse porta est congue quam egestas, id porta odio blandit. Duis venenatis justo vitae luctus venenatis. Nullam nec massa nisi. Mauris vel elit eget leo condimentum molestie in condimentum libero. Donec maximus ex a lacus pulvinar pulvinar. Aenean vel felis sed purus tempus tempus. `
