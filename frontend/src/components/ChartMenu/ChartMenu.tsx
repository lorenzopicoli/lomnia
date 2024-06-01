import { Button, Flex, Menu, Pill } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { endOfMonth } from 'date-fns/endOfMonth'
import { endOfWeek } from 'date-fns/endOfWeek'
import { endOfYear } from 'date-fns/endOfYear'
import { format } from 'date-fns/format'
import { startOfMonth } from 'date-fns/startOfMonth'
import { startOfWeek } from 'date-fns/startOfWeek'
import { startOfYear } from 'date-fns/startOfYear'
import { subHours } from 'date-fns/subHours'
import { subMonths } from 'date-fns/subMonths'
import { subWeeks } from 'date-fns/subWeeks'
import { subYears } from 'date-fns/subYears'
import { useEffect, useState } from 'react'
import type { Chart } from '../../charts/charts'

export function ChartMenu(props: {
  selectedCharts: Chart[]
  currentRange: [Date, Date]
  onDateChange: (range: [Date, Date]) => void
  onRemoveChart: (chart: Chart) => void
  onNewChart: () => void
}) {
  const [partialDateRange, setPartialDateRange] = useState<
    [Date | null, Date | null]
  >([null, null])
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    setPartialDateRange(dates)
  }
  const handleQuickDatesClick = (
    id: 'week' | '24h' | 'month' | 'year' | 'all'
  ) => {
    let range: [Date, Date]
    switch (id) {
      case 'week':
        range = [
          startOfWeek(subWeeks(new Date(), 1)),
          endOfWeek(subWeeks(new Date(), 1)),
        ]
        break
      case 'month':
        range = [
          startOfMonth(subMonths(new Date(), 1)),
          endOfMonth(subMonths(new Date(), 1)),
        ]
        break
      case 'year':
        range = [
          startOfYear(subYears(new Date(), 1)),
          endOfYear(subYears(new Date(), 1)),
        ]
        break
      case '24h':
        range = [subHours(new Date(), 24), new Date()]
        break
      case 'all':
        range = [subYears(new Date(), 100), new Date()]
        break
    }
    setPartialDateRange(range)
  }
  const handleRemove = (chart: Chart) => () => {
    props.onRemoveChart(chart)
  }
  useEffect(() => {
    if (partialDateRange[0] && partialDateRange[1]) {
      props.onDateChange(partialDateRange as [Date, Date])
    }
  }, [props, partialDateRange])
  return (
    <Menu shadow="md" width={200}>
      <Flex direction={'row'}>
        <Button onClick={props.onNewChart} variant={'subtle'}>
          Add chart
        </Button>
        <Menu.Target>
          <Button variant="subtle">
            {format(props.currentRange[0], 'MMMM do, yyyy HH:mm')} to{' '}
            {format(props.currentRange[1], 'MMMM do, yyyy HH:mm')}
          </Button>
        </Menu.Target>
        <Pill.Group>
          {props.selectedCharts.map((v) => (
            <Pill
              key={v.id}
              variant="default"
              withRemoveButton
              onRemove={handleRemove(v)}
            >
              {v.title}
            </Pill>
          ))}
        </Pill.Group>
      </Flex>

      <Menu.Dropdown w={460}>
        <Flex justify={'space-between'} p={'md'} gap={'md'}>
          <div>
            <Menu.Item onClick={() => handleQuickDatesClick('24h')}>
              Last 24 hours
            </Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick('week')}>
              Last week
            </Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick('month')}>
              Last month
            </Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick('year')}>
              Last year
            </Menu.Item>
            <Menu.Item onClick={() => handleQuickDatesClick('all')} color="red">
              All
            </Menu.Item>
          </div>
          <DatePicker
            type="range"
            value={partialDateRange}
            onChange={handleDateChange}
          />
        </Flex>
      </Menu.Dropdown>
    </Menu>
  )
}
