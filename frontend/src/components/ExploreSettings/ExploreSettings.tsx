import { useMemo, useState } from 'react'
import type { Chart } from '../../charts/charts'
import { Button, Flex, MultiSelect, Space } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { startOfMonth } from 'date-fns/startOfMonth'
import { endOfMonth } from 'date-fns/endOfMonth'

export type ExploreSettingsProps = {
  chartOptions: {
    group: string
    items: {
      label: string
      value: string
      data: Chart
    }[]
  }[]
  opened: boolean
  onSave: (charts: Chart[], dateRange: [Date, Date]) => void
}

export function ExploreSettings(props: ExploreSettingsProps) {
  const [selectedCharts, setSelectedCharts] = useState<Chart[]>([])
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    startOfMonth(new Date()),
    endOfMonth(new Date()),
  ])
  const chartsByValue = useMemo(() => {
    return props.chartOptions.reduce((acc, curr) => {
      for (const item of curr.items) {
        acc[item.value] = item.data
      }
      return acc
    }, {} as Record<string, Chart>)
  }, [props.chartOptions])

  const handleChartsSelectionChange = (values: string[]) => {
    setSelectedCharts(values.map((v) => chartsByValue[v]))
  }
  const handleSave = () => {
    if (dateRange[0] === null || dateRange[1] === null) {
      return
    }
    props.onSave(selectedCharts, dateRange as [Date, Date])
  }

  return (
    <>
      <Flex direction={'row'} gap={'md'} p={'sm'}>
        <DatePicker type="range" value={dateRange} onChange={setDateRange} />
        <Space w={'10vh'} />
        <Flex direction={'column'} align={'flex-start'} justify={'flex-start'}>
          <MultiSelect
            searchable
            label="Charts"
            checkIconPosition="right"
            placeholder="Choose charts to show"
            w="300px"
            onChange={handleChartsSelectionChange}
            data={props.chartOptions}
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
