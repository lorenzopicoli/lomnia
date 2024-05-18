import { AppShell } from '@mantine/core'
import { addDays } from 'date-fns/addDays'
import { format } from 'date-fns/format'
import { parse } from 'date-fns/parse'
import { startOfDay } from 'date-fns/startOfDay'
import { subDays } from 'date-fns/subDays'
import {
  Route,
  Routes,
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import Header from '../components/Header/Header'
import { useConfig } from '../utils/useConfig'
import { Explore } from './Explore/Explore'
import Home from './Home/Home'

function Layout() {
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
  const handleGoToExplore = () => {
    navigate({
      pathname: 'explore',
    })
  }

  const handleChangePrivateMode = (mode: boolean) =>
    config.updateConfig({ privateMode: mode })
  const handleSearch = () => null

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
          onGoToExplore={handleGoToExplore}
        />
      </AppShell.Header>
      <AppShell.Main>
        <Routes>
          <Route path={'/'} element={<Home />} />
          <Route path={'/explore'} element={<Explore />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default Layout
