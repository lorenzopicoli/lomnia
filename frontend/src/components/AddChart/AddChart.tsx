import { useMemo, useState } from 'react'
import type { Chart } from '../../charts/charts'
import { Button, Flex, MultiSelect } from '@mantine/core'
import { useAvailableCharts } from '../../charts/useAvailableCharts'

export type AddChartProps = {
  opened: boolean
  onSave: (charts: Chart[]) => void
}

export function AddChart(props: AddChartProps) {
  const [selectedCharts, setSelectedCharts] = useState<Chart[]>([])
  const { availableCharts } = useAvailableCharts()
  const chartsByValue = useMemo(() => {
    return availableCharts.reduce((acc, curr) => {
      for (const item of curr.items) {
        acc[item.value] = item.data
      }
      return acc
    }, {} as Record<string, Chart>)
  }, [availableCharts])

  const handleChartsSelectionChange = (values: string[]) => {
    setSelectedCharts(values.map((v) => chartsByValue[v]))
  }
  const handleSave = () => {
    props.onSave(selectedCharts)
  }

  return (
    <>
      <Flex direction={'row'} gap={'md'} p={'sm'}>
        <Flex direction={'column'} align={'flex-start'} justify={'flex-start'}>
          <MultiSelect
            searchable
            label="Charts"
            checkIconPosition="right"
            placeholder="Choose charts to show"
            w="300px"
            onChange={handleChartsSelectionChange}
            data={availableCharts}
          />
        </Flex>
      </Flex>
      <Flex align={'flex-end'} justify={'flex-end'}>
        <Button onClick={handleSave} variant="light">
          Done
        </Button>
      </Flex>
    </>
  )
}
