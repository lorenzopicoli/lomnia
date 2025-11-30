import {
  Accordion,
  ActionIcon,
  alpha,
  Button,
  Card,
  Container,
  Flex,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { type ChangeEvent, type ChangeEventHandler, useEffect, useMemo, useState } from "react";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import { cardDarkBackground } from "../../themes/mantineThemes";

export type HabitFeatureCondition = {
  field: "key" | "text_value" | "source";
  value?: string;
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
    <Stack>
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
              { value: "value", label: "Value" },
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

export function RulesList(props: {
  rules: HabitFeatureRule[];
  onRuleChanged: (newRule: HabitFeatureRule, index: number) => void;
  onRuleRemoved: (index: number) => void;
}) {
  const { theme } = useConfig();
  const newConditionSkeleton = (_conditions: HabitFeatureCondition[]) => ({
    field: "key" as const,
  });

  const handleNewCondition = (rule: HabitFeatureRule, index: number) => {
    props.onRuleChanged({ ...rule, conditions: [...rule.conditions, newConditionSkeleton(rule.conditions)] }, index);
  };
  const handleConditionChange =
    (rule: HabitFeatureRule, ruleIndex: number) => (newCondition: HabitFeatureCondition, conditionIndex: number) => {
      const updatedConditions = rule.conditions.map((c, idx) => (idx === conditionIndex ? newCondition : c));

      props.onRuleChanged({ ...rule, conditions: updatedConditions }, ruleIndex);
    };
  const handleConditionRemoved = (rule: HabitFeatureRule, ruleIndex: number) => (conditionIndex: number) => {
    const updatedConditions = rule.conditions.filter((_, idx) => idx !== conditionIndex);

    props.onRuleChanged({ ...rule, conditions: updatedConditions }, ruleIndex);
  };
  const handleRuleNameChanged = (rule: HabitFeatureRule, index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    props.onRuleChanged({ ...rule, name }, index);
  };

  const items = props.rules.map((rule, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
    <Accordion.Item key={`rule-${i}`} value={`rule-${i}`}>
      <Accordion.Control
        bg={alpha(theme.colors.violet[9], 0.5)}
        style={{ borderTopLeftRadius: "5px", borderTopRightRadius: "5px" }}
      >
        {rule.name}
      </Accordion.Control>
      <Accordion.Panel pt={"md"} pb={"md"}>
        <Stack>
          <TextInput flex={1} value={rule.name ?? ""} onChange={handleRuleNameChanged(rule, i)} />
          <ConditionsList
            conditions={rule.conditions ?? []}
            onConditionChanged={handleConditionChange(rule, i)}
            onConditionRemoved={handleConditionRemoved(rule, i)}
          />

          <DashedButton onClick={() => handleNewCondition(rule, i)} label="Add Condition (AND)" />
          <Select label="Extract" placeholder="" data={["Entry Value", "Array Value", "Constant", "Map Values"]} />
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  ));

  return <Accordion>{items}</Accordion>;
}

export function HabitFeatureBuilder(props: {
  onSave: (rules: HabitFeatureRule[]) => void;
  onChange: (rules: HabitFeatureRule[]) => void;
}) {
  const { onSave, onChange } = props;
  const newRuleSkeleton = (rules: HabitFeatureRule[]) => ({
    name: `Rule ${rules.length + 1}`,
    conditions: [{ field: "key" as const }],
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
            <Card.Section>
              <Title mt={"md"} ml={"lg"} order={3}>
                Preview Results
              </Title>
            </Card.Section>
          </Card>
        </Flex>
      </ScrollArea>
    </Paper>
  );
}
