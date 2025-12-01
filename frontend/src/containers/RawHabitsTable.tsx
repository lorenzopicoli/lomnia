import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { NumberParam, StringParam, useQueryParams } from 'use-query-params'
import { type RouterOutputs, trpc } from '../api/trpc'
import { Table, type TableColumn } from '../components/Table/Table'

type Habit = RouterOutputs['habits']['getRawHabitsTable']['entries'][number]
export function RawHabitsTable(props: { search?: string }) {
  const { search } = props
  const [params, setParams] = useQueryParams({
    search: StringParam,
    page: NumberParam,
  })

  const { data, isLoading } = useQuery(
    trpc.habits.getRawHabitsTable.queryOptions({
      page: params.page ?? 1,
      search,
      limit: 100,
    })
  )
  const { page, entries, total, limit } = data ?? {}

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset pagination if search changes
  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      page: 1,
    }))
  }, [search])
  const columns: TableColumn<Habit>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (habit) => (
        <>
          {habit.periodOfDay ? `${habit.periodOfDay} - ` : null}
          {habit.isFullDay
            ? new Date(habit.date).toLocaleDateString()
            : new Date(habit.date).toLocaleString()}
        </>
      ),
    },
    {
      key: 'key',
      header: 'Key',
      render: (habit) => habit.key,
    },
    {
      key: 'value',
      header: 'Value',
      render: (habit) =>
        typeof habit.value === 'string' || typeof habit.value === 'number'
          ? habit.value
          : JSON.stringify(habit.value),
    },
    {
      key: 'source',
      header: 'Source',
      render: (habit) => habit.source,
    },
  ]

  const handleNextPage = () => {
    setParams({
      page: (page ?? 1) + 1,
    })
  }
  const handlePrevPage = () => {
    setParams({
      page: (page ?? 1) - 1,
    })
  }

  return (
    <Table
      data={entries ?? []}
      columns={columns}
      getRowKey={(habit) => habit.id}
      isLoading={isLoading}
      page={page}
      limit={limit}
      total={total}
      onNextPage={handleNextPage}
      onPrevPage={handlePrevPage}
    />
  )
}
