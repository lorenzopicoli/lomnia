import {
  Accordion,
  alpha,
  Button,
  Card,
  Container,
  Flex,
  Paper,
  ScrollArea,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { safeScrollableArea } from '../../constants'
import { useConfig } from '../../contexts/ConfigContext'
import { cardDarkBackground } from '../../themes/mantineThemes'

export function AddHabitFeature() {
  const { theme } = useConfig()
  const [rules, setRules] = useState<any[]>([{ name: 'Rule 1' }])

  const builderItems = rules.map((rule, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
    <Accordion.Item key={`rule-${i}`} value={rule.name}>
      <Accordion.Control
        bg={alpha(theme.colors.violet[9], 0.5)}
        style={{ borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }}
      >
        {rule.name}
      </Accordion.Control>
      <Accordion.Panel pt={'md'} pb={'md'}>
        <Stack>
          <Flex gap={'sm'}>
            <Select
              placeholder="Match property"
              label="Conditions (AND)"
              miw={10}
              data={['Key', 'Value', 'Source']}
            />
            <TextInput label=" " flex={1} placeholder="Value" />
          </Flex>

          <Button
            variant="default"
            leftSection={<IconPlus size={16} />}
            styles={{
              root: {
                border: '2px dashed var(--mantine-color-dark-4)',
                backgroundColor: 'transparent',
                color: 'var(--mantine-color-dark-3)',
              },
            }}
          >
            Add Condition (AND)
          </Button>
          <Select
            label="Extract"
            placeholder=""
            data={['Entry Value', 'Array Value', 'Constant', 'Map Values']}
          />
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  ))
  return (
    <Paper component={Container} fluid h={'100vh'} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <Flex p={'lg'} gap={'lg'} mih={'90vh'} direction={'row'}>
          <Card p={'md'} w={'40%'} bg={cardDarkBackground}>
            <Card.Section p={'md'}>
              <Title order={3}>Builder</Title>
            </Card.Section>
            <Stack>
              <TextInput
                label="Feature name"
                w={'50%'}
                description="Must be unique"
              />
              <Accordion defaultValue="Rule 1">{builderItems}</Accordion>
              <Button
                variant="default"
                leftSection={<IconPlus size={16} />}
                onClick={() =>
                  setRules([...rules, { name: `Rule ${rules.length + 1}` }])
                }
                styles={{
                  root: {
                    border: '2px dashed var(--mantine-color-dark-4)',
                    backgroundColor: 'transparent',
                    color: 'var(--mantine-color-dark-3)',
                  },
                }}
              >
                Add Rule (OR)
              </Button>
            </Stack>
          </Card>
          <Card flex={1} w={'60%'} bg={cardDarkBackground}>
            <Card.Section>
              <Title mt={'md'} ml={'lg'} order={3}>
                Preview Results
              </Title>
            </Card.Section>
          </Card>
        </Flex>
      </ScrollArea>
    </Paper>
  )
}
