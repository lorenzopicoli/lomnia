import { Table } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '../../api/trpc'

export function RawHabits() {
  const { data, isLoading } = useQuery(
    trpc.habits.getRawHabitsTable.queryOptions({
      page: 0,
      limit: 500,
    })
  )

  const rows = (data ?? []).map((habit) => (
    <Table.Tr key={habit.id}>
      <Table.Td>
        {habit.periodOfDay ? `${habit.periodOfDay} - ` : null}
        {habit.isFullDay
          ? new Date(habit.date).toLocaleDateString()
          : new Date(habit.date).toLocaleString()}
      </Table.Td>
      <Table.Td>{habit.key}</Table.Td>
      <Table.Td>{habit.value as any}</Table.Td>
      <Table.Td>{habit.source}</Table.Td>
      <Table.Td>{habit.comments}</Table.Td>
    </Table.Tr>
  ))
  return (
    <Table.ScrollContainer minWidth={'100%'} maxHeight={'100vh'}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Key</Table.Th>
            <Table.Th>Value</Table.Th>
            <Table.Th>Source</Table.Th>
            <Table.Th>Comments</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
