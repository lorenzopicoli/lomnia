import { useState } from 'react'
import {
  ChartAreaConfig,
  ChartType,
  type ChartSource,
} from '../../charts/charts'
import {
  Button,
  Checkbox,
  Container,
  Flex,
  Group,
  Radio,
  Text,
  RadioGroup,
  Table,
} from '@mantine/core'
import { DecorativeLineChart } from '../DecorativeChart/DecorativeLineChart'
import { DecorativeBarChart } from '../DecorativeChart/DecorativeBarChart'
import { DecorativeAreaChart } from '../DecorativeChart/DecorativeAreaChart'
import styles from './AddChart.module.css'

const WrapInButton = (props: {
  onClicked: () => void
  children: React.ReactNode
}) => {
  return (
    <Container style={{ cursor: 'pointer' }} onClick={props.onClicked}>
      {props.children}
    </Container>
  )
}

const ChartTypeRadioGroup = ({
  resetSelectedRows,
  setSelectedType,
  selectedType,
}: {
  setSelectedType: (type: ChartType) => void
  resetSelectedRows: () => void
  selectedType?: ChartType
}) => {
  return (
    <RadioGroup
      value={selectedType}
      onChange={(value) => {
        if (value === 'line') {
          setSelectedType(ChartType.LineChart)
        }
        if (value === 'bar') {
          setSelectedType(ChartType.BarChart)
        }
        if (value === 'area') {
          setSelectedType(ChartType.AreaChart)
        }
        resetSelectedRows()
      }}
    >
      <Flex pt="xl" gap={'sm'} justify={'flex-start'} wrap={'wrap'}>
        {Object.values(ChartType).map((type) => {
          const byType = {
            [ChartType.LineChart]: {
              title: 'Line Chart',
              decoration: <DecorativeLineChart />,
            },
            [ChartType.BarChart]: {
              title: 'Bar Chart',
              decoration: <DecorativeBarChart />,
            },
            [ChartType.AreaChart]: {
              title: 'Area Chart',
              decoration: <DecorativeAreaChart />,
            },
          }
          // TODO: change class names or refactor the class to be generic
          return (
            <Radio.Card
              className={styles.cardCheckbox}
              radius="md"
              value={type}
              flex={1}
            >
              <Group wrap="nowrap" align="flex-start">
                <Radio.Indicator />
                <div>
                  <Text className={styles.cardCheckboxTitle}>
                    {byType[type].title}
                  </Text>
                  <Container p={0} w={150} h={50}>
                    {byType[type].decoration}
                  </Container>
                </div>
              </Group>
            </Radio.Card>
          )
        })}
      </Flex>
    </RadioGroup>
  )
}
export function AddChartShapePicker(props: {
  onAdd?: (
    shapes: Array<
      ChartAreaConfig['shapes'][number] & {
        label: string
      }
    >
  ) => void
  data: { yKey: string; label: string; source: ChartSource }[]
}) {
  const { onAdd } = props

  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<ChartType | undefined>()

  const handleAdd = () => {
    if (onAdd && selectedType) {
      onAdd(
        props.data
          .filter((d) => selectedRows.includes(d.yKey))
          .map((d) => ({
            id: d.yKey,
            isMain: true,
            source: d.source,
            yKey: d.yKey,
            type: selectedType,
            label: d.label,
          }))
      )
    }
  }

  const rows = props.data.map((d) => {
    const handleRowClick = () => {
      setSelectedRows(
        !selectedRows.includes(d.yKey)
          ? [...selectedRows, d.yKey]
          : selectedRows.filter((position) => position !== d.yKey)
      )
    }
    return (
      <Table.Tr
        key={d.yKey}
        bg={
          selectedRows.includes(d.yKey)
            ? 'var(--mantine-color-violet-light)'
            : undefined
        }
      >
        <Table.Td>
          <WrapInButton onClicked={handleRowClick}>
            <Checkbox
              aria-label="Select row"
              checked={selectedRows.includes(d.yKey)}
              onChange={handleRowClick}
            />
          </WrapInButton>
        </Table.Td>
        <Table.Td>
          <WrapInButton onClicked={handleRowClick}>{d.label}</WrapInButton>
        </Table.Td>
        <Table.Td>
          <WrapInButton onClicked={handleRowClick}>{d.source}</WrapInButton>
        </Table.Td>
      </Table.Tr>
    )
  })
  return (
    <>
      <ChartTypeRadioGroup
        resetSelectedRows={() => setSelectedRows([])}
        setSelectedType={setSelectedType}
        selectedType={selectedType}
      />
      {selectedType ? (
        <Table mt={'xl'}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th />
              <Table.Th>Name</Table.Th>
              <Table.Th>Source</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      ) : null}
      {selectedRows.length > 0 ? (
        <Flex align={'flex-end'} mt={'xl'} justify={'flex-end'}>
          <Button variant="light" onClick={handleAdd}>
            Add
          </Button>
        </Flex>
      ) : null}
    </>
  )
}
