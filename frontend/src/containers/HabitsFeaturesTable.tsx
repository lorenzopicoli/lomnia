import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { NumberParam, StringParam, useQueryParams } from 'use-query-params'
import { type RouterOutputs, trpc } from '../api/trpc'
import { Table, type TableColumn } from '../components/Table/Table'

type HabitFeature =
  RouterOutputs['habits']['getFeaturesTable']['entries'][number]
export function HabitsFeaturesTable(props: { search?: string }) {
  const { search } = props
  const [params, setParams] = useQueryParams({
    search: StringParam,
    page: NumberParam,
  })

  const { data, isLoading } = useQuery(
    trpc.habits.getFeaturesTable.queryOptions({
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
  const columns: TableColumn<HabitFeature>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (feature) => feature.name,
    },
    {
      key: 'matched',
      header: '# of habits matched',
      render: (feature) => feature.matchedHabitEntries,
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: (feature) => feature.createdAt?.toLocaleString(),
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
      getRowKey={(feature) => feature.id}
      isLoading={isLoading}
      page={page}
      limit={limit}
      total={total}
      onNextPage={handleNextPage}
      onPrevPage={handlePrevPage}
    />
  )
}
