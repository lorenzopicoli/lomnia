import { Button, Card, Stack, Textarea, TextInput, Title } from "@mantine/core";
import { type ChangeEvent, type ChangeEventHandler, useEffect, useMemo, useState } from "react";
import { DashedButton } from "../../components/DashedButton/DashedButton";
import { RulesList } from "./RulesList";
import type { HabitFeature, HabitFeatureRule } from "./types";

export function HabitFeatureBuilder(props: {
  initialData?: HabitFeature;
  onSave: (feature: HabitFeature) => void;
  onChange: (rules: HabitFeatureRule[]) => void;
}) {
  const { onSave, onChange, initialData } = props;

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
  const [rules, setRules] = useState<HabitFeatureRule[]>(initialData ? initialData.rules : [newRuleSkeleton([])]);
  const [name, setName] = useState(initialData?.name ?? "");

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
    onSave({ name, rules });
  };
  const handleFeatureNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
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
          <TextInput
            value={name}
            onChange={handleFeatureNameChange}
            label="Feature name"
            w={"50%"}
            description="Must be unique"
          />
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
