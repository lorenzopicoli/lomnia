import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/code-highlight/styles.css'
import '@mantine/spotlight/styles.css'

import 'maplibre-gl/dist/maplibre-gl.css'
import 'allotment/dist/style.css'
import { MantineProvider, createTheme, rem } from '@mantine/core'
import { httpBatchLink } from '@trpc/react-query'
import { useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { trpc } from './api/trpc'
import { ConfigProvider } from './containers/ConfigContext'
import Layout from './pages/Layout'

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
    path: '/*',
    element: <Layout />,
  },
])

function App() {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3010/trpc',
          async headers() {
            return {}
          },
        }),
      ],
    })
  )
  const queryClient = new QueryClient()
  return (
    <>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <ConfigProvider>
          <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme} defaultColorScheme="dark">
              <RouterProvider router={router} />
            </MantineProvider>
          </QueryClientProvider>
        </ConfigProvider>
      </trpc.Provider>
    </>
  )
}

export default App
