import {
  Container,
  Modal,
  Paper,
  ScrollArea,
  Space,
  useMantineTheme,
  Text,
} from '@mantine/core'
import { useMemo, useState } from 'react'
import { ResizableGrid } from '../../components/ResizableGrid/ResizableGrid'
import { useDisclosure } from '@mantine/hooks'
import { removeNills } from '../../utils/removeNils'
import { AddChart } from '../../components/AddChart/AddChart'
import { useChartGridLayout } from '../../charts/useChartGridLayout'
import { ChartMenu } from '../../components/ChartMenu/ChartMenu'
import { subDays } from 'date-fns'
import { GenericChartContainer } from '../../components/SimpleChart/GenericChartContainer'
import type { ChartAreaConfig } from '../../charts/charts'
import { EventEmitterProvider } from '@visx/xychart'
import { SynchronizedProvider } from '../../charts/SynchronizedContext'

export function Explore() {
  const theme = useMantineTheme()

  const [dateRange, setDateRange] = useState<[Date, Date]>([
    subDays(new Date(), 30),
    new Date(),
  ])
  const [opened, { open, close }] = useDisclosure(false)
  const {
    chartsBeingShown,
    onAddCharts,
    onRemoveChart,
    isChangingLayout,
    gridProps,
  } = useChartGridLayout('explore')
  const handleAddChart = (chart: ChartAreaConfig) => {
    onAddCharts([chart])
    close()
  }
  const charts = useMemo(() => {
    return Object.values(chartsBeingShown).filter(removeNills)
  }, [chartsBeingShown])

  const chartAreaTopMargin = 40
  return (
    <Paper component={Container} fluid h={'100vh'} bg={theme.colors.dark[9]}>
      <ScrollArea
        h="calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        type="never"
      >
        <Container
          fluid
          pt={'md'}
          pr={0}
          pl={0}
          m={0}
          style={{ position: 'relative' }}
        >
          <Modal
            opened={opened}
            onClose={close}
            title="Add a new chart"
            size={'xl'}
            bg={theme.colors.dark[9]}
            style={{ backgroundColor: theme.colors.dark[9] }}
          >
            <AddChart opened={opened} onSave={handleAddChart} />
          </Modal>
          <ChartMenu
            selectedCharts={charts}
            onRemoveChart={onRemoveChart}
            currentRange={dateRange}
            onDateChange={setDateRange}
            onNewChart={() => open()}
          />
          <Space h={50} />
          <EventEmitterProvider>
            <SynchronizedProvider>
              {charts.length > 0 ? (
                <ResizableGrid {...gridProps} rowHeight={500}>
                  {charts.map((chart) => (
                    <div key={chart.id}>
                      <Container
                        display={'flex'}
                        p={0}
                        pos={'absolute'}
                        top={0}
                        left={0}
                      >
                        <Text pr="sm">X: {chart.xKey}</Text>
                        <Text>
                          Y: {chart.shapes.map((s) => s.yKey).join(', ')}
                        </Text>
                      </Container>
                      {isChangingLayout ? (
                        <Container
                          fluid
                          h={'100%'}
                          p={0}
                          bg={theme.colors.dark[8]}
                        />
                      ) : (
                        <Container
                          fluid
                          h={`calc(100% - ${chartAreaTopMargin}px)`}
                          mt={chartAreaTopMargin}
                          p={0}
                        >
                          <GenericChartContainer
                            chart={chart}
                            startDate={dateRange[0]}
                            endDate={dateRange[1]}
                          />
                        </Container>
                      )}
                    </div>
                  ))}
                </ResizableGrid>
              ) : null}
            </SynchronizedProvider>
          </EventEmitterProvider>
        </Container>
      </ScrollArea>
    </Paper>
  )
}
