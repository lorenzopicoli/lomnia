import {
  Accordion,
  ActionIcon,
  alpha,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconArrowRightCircle, IconPlus, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { type ChangeEvent, type ChangeEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { v4 } from "uuid";
import { type RouterOutputs, trpc } from "../../api/trpc";
import { Table, type TableColumn } from "../../components/Table/Table";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import { cardDarkBackground } from "../../themes/mantineThemes";
import { isNumber } from "../../utils/isNumber";

export type HabitFeatureCondition = {
  field: "key" | "text_value" | "source";
  value: string;
};

export type HabitFeatureExtraction = {
  type: "array_values" | "constant" | "map_values" | "entry_value";
  mapping?: Record<string, string | number>;
  mappingFallbackTo?: string | number;
  constantValue?: number | string | boolean;
};

export type HabitFeatureRule = {
  name: string;
  conditions: HabitFeatureCondition[];
  extraction: HabitFeatureExtraction;
};

export type HabitFeature = {
  name: string;
  rules: HabitFeatureRule[];
};

export function DashedButton(props: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="default"
      onClick={props.onClick}
      leftSection={<IconPlus size={16} />}
      styles={{
        root: {
          border: "2px dashed var(--mantine-color-dark-4)",
          backgroundColor: "transparent",
          color: "var(--mantine-color-dark-3)",
        },
      }}
    >
      {props.label}
    </Button>
  );
}

export function ConditionsList(props: {
  conditions: HabitFeatureCondition[];
  onConditionChanged: (newCondition: HabitFeatureCondition, index: number) => void;
  onConditionRemoved: (index: number) => void;
}) {
  const { theme } = useConfig();
  const handleRemoveCondition = (i: number) => {
    props.onConditionRemoved(i);
  };
  const handleFieldChange = (index: number) => (value: string | null) => {
    const condition = props.conditions[index];
    props.onConditionChanged({ ...condition, field: (value as any) || "key" }, index);
  };

  const handleValueChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const condition = props.conditions[index];
    const value = e.target.value;
    props.onConditionChanged({ ...condition, value }, index);
  };

  return (
    <Stack gap={"sm"}>
      <Text size="sm">Conditions (AND)</Text>
      {props.conditions.map((condition, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <Flex key={i} gap={"sm"}>
          <Select
            flex={0}
            miw={100}
            value={condition.field}
            onChange={handleFieldChange(i)}
            placeholder="Match property"
            data={[
              { value: "key", label: "Key" },
              { value: "text_value", label: "Value" },
              { value: "source", label: "Source" },
            ]}
          />
          <TextInput flex={1} placeholder="Value" value={condition.value ?? ""} onChange={handleValueChange(i)} />
          <ActionIcon flex={0} variant="subtle" onClick={() => handleRemoveCondition(i)}>
            <IconTrash size={20} color={alpha(theme.colors.red[9], 0.8)} />
          </ActionIcon>
        </Flex>
      ))}
    </Stack>
  );
}

export function Extraction(props: {
  extraction: HabitFeatureExtraction;
  onExtractionChanged: (extraction: HabitFeatureExtraction) => void;
}) {
  const { extraction, onExtractionChanged } = props;
  const { theme } = useConfig();

  const handleTypeChanged = (value: string | null) => {
    const newType = (value as any) ?? "constant";
    onExtractionChanged({
      ...extraction,
      constantValue: newType === "constant" ? extraction.constantValue : undefined,
      type: newType,
    });
  };

  const formatValue = (raw: string) => {
    let parsed: string | number | boolean = raw;

    if (raw === "true") {
      parsed = true;
    } else if (raw === "false") {
      parsed = false;
    } else if (isNumber(raw)) {
      parsed = Number(raw);
    }
    return parsed;
  };

  const handleConstantChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    onExtractionChanged({
      ...extraction,
      constantValue: formatValue(raw),
    });
  };

  return (
    <Stack gap={"sm"}>
      <Text size="sm">Extract</Text>
      <Select
        placeholder=""
        value={extraction.type}
        onChange={handleTypeChanged}
        data={[
          { value: "entry_value", label: "Entry Value" },
          { value: "array_values", label: "Array Value" },
          { value: "constant", label: "Constant Value" },
          { value: "map_values", label: "Map Values" },
        ]}
      />
      {extraction.type === "constant" ? (
        <TextInput value={String(extraction.constantValue ?? "")} onChange={handleConstantChanged} />
      ) : null}
      {extraction.type === "map_values" ? (
        <Stack>
          {Object.entries(extraction.mapping ?? { "": "" }).map(([key, value]) => (
            <Flex key={key + String(value)} align="center" gap={"sm"}>
              <TextInput flex={1} label={"From"} value={key} onChange={() => {}} />
              {/* mt is necessary to match the label */}
              <Box mt="xl">
                <IconArrowRightCircle />
              </Box>
              <TextInput flex={1} label={"To"} value={value} onChange={() => {}} />

              <ActionIcon mt={"lg"} flex={0} variant="subtle" onClick={() => {}}>
                <IconTrash size={20} color={alpha(theme.colors.red[9], 0.8)} />
              </ActionIcon>
            </Flex>
          ))}
          <DashedButton label="Add mapping" onClick={() => {}} />
          <TextInput label={"Fallback"} value={""} onChange={() => {}} />
        </Stack>
      ) : null}
    </Stack>
  );
}

export function RulesList(props: {
  rules: HabitFeatureRule[];
  onRuleChanged: (newRule: HabitFeatureRule, index: number) => void;
  onRuleRemoved: (index: number) => void;
}) {
  return (
    <Accordion defaultValue={"rule-0"}>
      {props.rules.map((rule, i) => (
        <RuleItem
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={`rule-${i}`}
          rule={rule}
          index={i}
          onRuleChanged={props.onRuleChanged}
          onRuleRemoved={props.onRuleRemoved}
        />
      ))}
    </Accordion>
  );
}

function RuleItem(props: {
  rule: HabitFeatureRule;
  index: number;
  onRuleChanged: (newRule: HabitFeatureRule, index: number) => void;
  onRuleRemoved: (index: number) => void;
}) {
  const { rule, index, onRuleChanged, onRuleRemoved } = props;
  const { theme } = useConfig();

  const handleNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onRuleChanged({ ...rule, name: e.target.value }, index);
    },
    [rule, index, onRuleChanged],
  );

  const handleConditionChanged = useCallback(
    (newCondition: HabitFeatureCondition, conditionIndex: number) => {
      const updatedConditions = rule.conditions.map((c, idx) => (idx === conditionIndex ? newCondition : c));
      onRuleChanged({ ...rule, conditions: updatedConditions }, index);
    },
    [rule, index, onRuleChanged],
  );

  const handleConditionRemoved = useCallback(
    (conditionIndex: number) => {
      const updatedConditions = rule.conditions.filter((_, idx) => idx !== conditionIndex);
      onRuleChanged({ ...rule, conditions: updatedConditions }, index);
    },
    [rule, index, onRuleChanged],
  );

  const handleAddCondition = useCallback(() => {
    onRuleChanged(
      {
        ...rule,
        conditions: [...rule.conditions, { field: "key" as const, value: "" }],
      },
      index,
    );
  }, [rule, index, onRuleChanged]);

  const handleExtractionChanged = useCallback(
    (extraction: HabitFeatureExtraction) => {
      onRuleChanged({ ...rule, extraction }, index);
    },
    [rule, index, onRuleChanged],
  );

  const handleRemove = useCallback(() => {
    onRuleRemoved(index);
  }, [index, onRuleRemoved]);

  return (
    <Accordion.Item value={`rule-${index}`}>
      <Accordion.Control
        bg={alpha(theme.colors.violet[9], 0.5)}
        style={{ borderTopLeftRadius: "5px", borderTopRightRadius: "5px" }}
      >
        {rule.name}
      </Accordion.Control>
      <Accordion.Panel pt={"md"} pb={"md"}>
        <Stack gap={"lg"}>
          <Group>
            <TextInput flex={1} value={rule.name ?? ""} onChange={handleNameChange} />
            <ActionIcon flex={0} variant="subtle" onClick={handleRemove}>
              <IconTrash size={20} color={alpha(theme.colors.red[9], 0.8)} />
            </ActionIcon>
          </Group>
          <ConditionsList
            conditions={rule.conditions ?? []}
            onConditionChanged={handleConditionChanged}
            onConditionRemoved={handleConditionRemoved}
          />
          <DashedButton onClick={handleAddCondition} label="Add Condition (AND)" />
          <Extraction extraction={rule.extraction} onExtractionChanged={handleExtractionChanged} />
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

export function HabitFeatureBuilder(props: {
  onSave: (rules: HabitFeatureRule[]) => void;
  onChange: (rules: HabitFeatureRule[]) => void;
}) {
  const { onSave, onChange } = props;
  const newRuleSkeleton = (rules: HabitFeatureRule[]) => ({
    name: `Rule ${rules.length + 1}`,
    conditions: [
      {
        field: "key" as const,
        value: "",
      },
    ],
    extraction: {
      type: "constant" as const,
    },
  });
  const [rules, setRules] = useState<HabitFeatureRule[]>([newRuleSkeleton([])]);

  const handleNewRule = () => {
    setRules([...rules, newRuleSkeleton(rules)]);
  };

  const handleRuleChange = (rule: HabitFeatureRule, i: number) => {
    setRules((prev) => prev.map((r, idx) => (idx === i ? rule : r)));
  };
  const handleRuleRemoved = (i: number) => {
    setRules((prev) => prev.filter((_, idx) => idx !== i));
  };
  const handleJSONRuleChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const value = e.target.value;

    try {
      const parsed = JSON.parse(value);
      setRules(parsed);
    } catch {}
  };
  const handleSave = () => {
    onSave(rules);
  };
  const textAreaValue = useMemo(() => JSON.stringify(rules, null, 2), [rules]);

  useEffect(() => {
    onChange(rules);
  }, [rules, onChange]);

  return (
    <>
      <Card.Section p={"md"}>
        <Title order={3}>Builder</Title>
      </Card.Section>
      <Card.Section p={"md"}>
        <Stack>
          <TextInput label="Feature name" w={"50%"} description="Must be unique" />
          <RulesList onRuleChanged={handleRuleChange} onRuleRemoved={handleRuleRemoved} rules={rules} />
          <DashedButton onClick={handleNewRule} label="Add Rule (OR)" />
          <Button onClick={handleSave} variant="filled" size="md">
            Save
          </Button>
        </Stack>
      </Card.Section>

      <Textarea value={textAreaValue} onChange={handleJSONRuleChange} label="Rules in JSON:" autosize minRows={2} />
    </>
  );
}
export function AddHabitFeature() {
  const { theme } = useConfig();
  const [rules, setRules] = useState<HabitFeatureRule[]>([]);
  const [debouncedRules] = useDebouncedValue(rules, 200);

  const { data, isLoading } = useQuery(trpc.habits.previewFeaturesExtraction.queryOptions(debouncedRules));
  const columns: TableColumn<RouterOutputs["habits"]["previewFeaturesExtraction"][number]>[] = [
    {
      key: "Habit ID",
      header: "Habit ID",
      width: 100,
      render: (feature) => feature.habit.id,
    },
    {
      key: "Habit Key",
      header: "Habit Key",
      render: (feature) => feature.habit.key,
    },
    {
      key: "Original",
      header: "Original Value",
      render: (feature) => String(feature.feature.originalValue ?? "-"),
    },
    {
      key: "Extracted",
      header: "Extracted Value",
      render: (feature) => String(feature.feature.value ?? "-"),
    },
  ];
  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <Flex p={"lg"} gap={"lg"} mih={"90vh"} direction={"row"}>
          {/* Left panel */}
          <Card p={"md"} w={"40%"} bg={cardDarkBackground}>
            <HabitFeatureBuilder onChange={setRules} onSave={() => {}} />
          </Card>
          {/* Right panel */}
          <Card flex={1} w={"60%"} bg={cardDarkBackground}>
            <Card.Section p={"md"}>
              <Title order={3}>Preview Results</Title>
            </Card.Section>
            <Text c={theme.colors.gray[6]} size="sm">
              Displaying the first 100 extracted features
            </Text>
            <Card.Section p={"md"}>
              <Table data={data ?? []} columns={columns} getRowKey={() => v4()} isLoading={isLoading} />
            </Card.Section>
          </Card>
        </Flex>
      </ScrollArea>
    </Paper>
  );
}
