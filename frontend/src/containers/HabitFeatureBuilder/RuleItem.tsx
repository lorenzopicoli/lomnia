import { Accordion, ActionIcon, alpha, Group, Stack, TextInput } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { type ChangeEvent, useCallback } from "react";
import { DashedButton } from "../../components/DashedButton/DashedButton";
import { useConfig } from "../../contexts/ConfigContext";
import { ConditionsList } from "./ConditionsList";
import { Extraction } from "./Extraction";
import type { HabitFeatureCondition, HabitFeatureExtraction, HabitFeatureRule } from "./types";

export function RuleItem(props: {
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
