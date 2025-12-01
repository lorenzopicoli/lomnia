import {
  ActionIcon,
  Flex,
  Group,
  Table as MantineTable,
  Paper,
  Text,
} from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useConfig } from '../../contexts/ConfigContext'
import { cardDarkBackground } from '../../themes/mantineThemes'
import { isNotNill } from '../../utils/isNotNil'

export interface TableColumn<T> {
  /**
   * Unique identifier for the column
   */
  key: string
  /**
   * Header label to display
   */
  header: string
  /**
   * Function to render the cell content
   */
  render: (row: T) => React.ReactNode
  /**
   * Optional width for the column
   */
  width?: string | number
  /**
   * Optional text alignment
   */
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T> {
  /**
   * Array of data to display
   */
  data: T[]
  /**
   * Column definitions
   */
  columns: TableColumn<T>[]
  /**
   * Function to extract unique key from each row
   */
  getRowKey: (row: T) => string | number
  /**
   * Whether the table is loading
   */
  isLoading?: boolean

  page?: number
  limit?: number
  total?: number

  onNextPage?: () => void
  onPrevPage?: () => void
}

export function Table<T>(props: TableProps<T>) {
  const { theme } = useConfig()
  const {
    data,
    columns,
    getRowKey,
    isLoading = false,
    page,
    limit,
    total,
    onNextPage,
    onPrevPage,
  } = props

  const rows = data.map((row) => (
    <MantineTable.Tr key={getRowKey(row)}>
      {columns.map((column) => (
        <MantineTable.Td
          key={column.key}
          pl={'lg'}
          h={50}
          style={{
            width: column.width,
            textAlign: column.align,
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
          }}
        >
          {column.render(row)}
        </MantineTable.Td>
      ))}
    </MantineTable.Tr>
  ))

  return (
    <Paper
      radius="lg"
      bg={cardDarkBackground}
      flex={1}
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <MantineTable.ScrollContainer flex={1} minWidth={'100%'} h="100%">
        <MantineTable layout="fixed" bdrs={'lg'} stickyHeader>
          <MantineTable.Thead>
            <MantineTable.Tr>
              {columns.map((column) => (
                <MantineTable.Th
                  key={column.key}
                  pt="xl"
                  pl={'lg'}
                  bg={theme.colors.violet[9]}
                  style={{
                    width: column.width,
                    textAlign: column.align,
                  }}
                >
                  {column.header}
                </MantineTable.Th>
              ))}
            </MantineTable.Tr>
          </MantineTable.Thead>
          <MantineTable.Tbody>
            {isLoading ? (
              <MantineTable.Tr>
                <MantineTable.Td
                  colSpan={columns.length}
                  style={{ textAlign: 'center' }}
                >
                  Loading...
                </MantineTable.Td>
              </MantineTable.Tr>
            ) : (
              rows
            )}
          </MantineTable.Tbody>
        </MantineTable>
      </MantineTable.ScrollContainer>
      {isNotNill(page) &&
      isNotNill(limit) &&
      isNotNill(total) &&
      isNotNill(onNextPage) &&
      isNotNill(onPrevPage) ? (
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
        />
      ) : null}
    </Paper>
  )
}

function Pagination(props: {
  limit: number
  page: number
  total: number

  onNextPage: () => void
  onPrevPage: () => void
}) {
  const { limit, page, total, onNextPage, onPrevPage } = props
  const first = (page - 1) * limit + 1
  const last = first + limit - 1
  return (
    <Flex justify={'flex-end'}>
      <Group p={'sm'}>
        <Flex>
          <Text fz={'sm'} span>
            <Text fz={'sm'} span fw={'bolder'}>
              {`${first}-${last} `}
            </Text>
            of {total}
          </Text>
        </Flex>
        <ActionIcon
          variant="transparent"
          onClick={onPrevPage}
          disabled={page === 1}
        >
          <IconChevronLeft />
        </ActionIcon>
        <ActionIcon
          variant="transparent"
          onClick={onNextPage}
          disabled={last >= total}
        >
          <IconChevronRight />
        </ActionIcon>
      </Group>
    </Flex>
  )
}
