import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './App.css'
import Home from './pages/Home'
// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/code-highlight/styles.css'
import '@mantine/spotlight/styles.css'
import { MantineProvider, createTheme, rem } from '@mantine/core'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

const theme = createTheme({
  colors: {},

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
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <RouterProvider router={router} />
        </MantineProvider>
      </QueryClientProvider>
    </>
  )
}

export default App
