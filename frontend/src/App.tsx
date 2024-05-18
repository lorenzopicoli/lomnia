import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from './pages/Home'
// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/code-highlight/styles.css'
import '@mantine/spotlight/styles.css'

import 'maplibre-gl/dist/maplibre-gl.css'
import 'allotment/dist/style.css'
import { MantineProvider, createTheme, rem } from '@mantine/core'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ConfigProvider } from './containers/ConfigContext'

const theme = createTheme({
  colors: {
    violet: [
      '#f6ecff',
      '#e7d6fb',
      '#caabf1',
      '#ac7ce8',
      '#9354e0',
      '#833cdb',
      '#7b2eda',
      '#6921c2',
      '#5d1cae',
      '#501599',
    ],
    ye: [
      '#fff8e0',
      '#ffeeca',
      '#ffdb99',
      '#ffc762',
      '#ffb536',
      '#ffab18',
      '#ffa503',
      '#e49000',
      '#cb7f00',
      '#b06d00',
    ],
    // dark: [
    //   '#313131',
    //   '#2e2e2e',
    //   '#292929',
    //   '#242424',
    //   '#1f1f1f',
    //   '#1c1c1c',
    //   '#1a1a1a',
    //   '#171717',
    //   '#141414',
    //   '#111111',
    // ],
  },
  primaryColor: 'violet',

  fontFamily: 'JetBrains Mono',
  fontFamilyMonospace: 'JetBrains Mono',

  focusRing: 'auto',

  headings: {
    fontFamily: 'JetBrains Mono, monospace',
    sizes: {
      h1: { fontSize: rem(36) },
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
])

function App() {
  const queryClient = new QueryClient()
  return (
    <>
      <ConfigProvider>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme} defaultColorScheme="dark">
            <RouterProvider router={router} />
          </MantineProvider>
        </QueryClientProvider>
      </ConfigProvider>
    </>
  )
}

export default App
