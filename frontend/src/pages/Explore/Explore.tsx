import {
  Container,
  Modal,
  Paper,
  ScrollArea,
  Space,
  useMantineTheme,
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
            {charts.length > 0 ? (
              <ResizableGrid {...gridProps} rowHeight={500}>
                {charts.map((chart) => (
                  <div key={chart.id}>
                    {isChangingLayout ? (
                      <Container
                        fluid
                        h={'100%'}
                        p={0}
                        bg={theme.colors.dark[8]}
                      />
                    ) : (
                      <GenericChartContainer
                        chart={chart}
                        startDate={dateRange[0]}
                        endDate={dateRange[1]}
                      />
                    )}
                  </div>
                ))}
              </ResizableGrid>
            ) : null}
          </EventEmitterProvider>
        </Container>
      </ScrollArea>
    </Paper>
  )
}
